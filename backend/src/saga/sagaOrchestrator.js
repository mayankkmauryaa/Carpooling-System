const { prisma } = require('../database/connection');
const logger = require('../middleware/logger');

class SagaState {
  static PENDING = 'PENDING';
  static IN_PROGRESS = 'IN_PROGRESS';
  static COMPLETED = 'COMPLETED';
  static FAILED = 'FAILED';
  static COMPENSATING = 'COMPENSATING';
  static ROLLED_BACK = 'ROLLED_BACK';
}

class SagaStep {
  constructor(name, executeFn, compensateFn) {
    this.name = name;
    this.executeFn = executeFn;
    this.compensateFn = compensateFn;
  }

  async execute(context) {
    return await this.executeFn(context);
  }

  async compensate(context) {
    if (this.compensateFn) {
      return await this.compensateFn(context);
    }
    return true;
  }
}

class Saga {
  constructor(name, steps) {
    this.name = name;
    this.steps = steps;
    this.currentStepIndex = -1;
    this.context = {};
  }

  async execute(initialContext = {}) {
    this.context = { ...initialContext };
    this.currentStepIndex = -1;

    const saga = await this.createSagaRecord();

    try {
      await this.updateSagaStatus(saga.id, SagaState.IN_PROGRESS);

      for (let i = 0; i < this.steps.length; i++) {
        this.currentStepIndex = i;
        const step = this.steps[i];

        logger.info(`Saga [${this.name}]: Executing step ${i + 1}/${this.steps.length}: ${step.name}`);

        const result = await step.execute(this.context);

        if (result && result.success !== false) {
          this.context[step.name] = result;
          await this.logStep(saga.id, step.name, 'SUCCESS', result);
        } else {
          throw new Error(result?.error || `Step ${step.name} failed`);
        }
      }

      await this.updateSagaStatus(saga.id, SagaState.COMPLETED);
      logger.info(`Saga [${this.name}]: Completed successfully`);

      return { success: true, sagaId: saga.id, context: this.context };

    } catch (error) {
      logger.error(`Saga [${this.name}]: Failed at step ${this.currentStepIndex + 1}`, { 
        error: error.message 
      });

      await this.compensate(saga.id);
      await this.updateSagaStatus(saga.id, SagaState.FAILED);

      return { success: false, error: error.message, sagaId: saga.id };
    }
  }

  async compensate(sagaId) {
    logger.info(`Saga [${this.name}]: Starting compensation`);
    await this.updateSagaStatus(sagaId, SagaState.COMPENSATING);

    for (let i = this.currentStepIndex; i >= 0; i--) {
      const step = this.steps[i];

      try {
        logger.info(`Saga [${this.name}]: Compensating step ${i + 1}: ${step.name}`);
        await step.compensate(this.context);
        await this.logStep(sagaId, step.name, 'COMPENSATED', null);
      } catch (compensateError) {
        logger.error(`Saga [${this.name}]: Compensation failed for step ${step.name}`, {
          error: compensateError.message
        });
        await this.logStep(sagaId, step.name, 'COMPENSATION_FAILED', { 
          error: compensateError.message 
        });
      }
    }

    await this.updateSagaStatus(sagaId, SagaState.ROLLED_BACK);
    logger.info(`Saga [${this.name}]: Rolled back`);
  }

  async createSagaRecord() {
    return await prisma.sagaLog.create({
      data: {
        sagaType: this.name,
        status: SagaState.PENDING,
        currentStep: 0,
        totalSteps: this.steps.length
      }
    });
  }

  async updateSagaStatus(sagaId, status) {
    await prisma.sagaLog.update({
      where: { id: sagaId },
      data: {
        status,
        currentStep: this.currentStepIndex + 1,
        completedAt: status === SagaState.COMPLETED ? new Date() : null
      }
    });
  }

  async logStep(sagaId, stepName, status, result) {
    await prisma.sagaStepLog.create({
      data: {
        sagaId,
        stepName,
        status,
        result: result ? JSON.stringify(result) : null,
        executedAt: new Date()
      }
    });
  }
}

class SagaOrchestrator {
  constructor() {
    this.sagas = new Map();
  }

  register(name, steps) {
    this.sagas.set(name, steps);
  }

  async execute(name, context) {
    const steps = this.sagas.get(name);
    if (!steps) {
      throw new Error(`Saga ${name} not found`);
    }

    const saga = new Saga(name, steps);
    return await saga.execute(context);
  }

  getRegisteredSagas() {
    return Array.from(this.sagas.keys());
  }
}

const sagaOrchestrator = new SagaOrchestrator();

module.exports = {
  Saga,
  SagaStep,
  SagaState,
  SagaOrchestrator,
  sagaOrchestrator
};
