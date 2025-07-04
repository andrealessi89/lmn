import cron from 'node-cron';

class CronService {
  constructor() {
    this.jobs = new Map();
  }

  /**
   * Initialize all cron jobs
   */
  initializeJobs() {
    // Placeholder for future cron jobs
    console.log('✅ Cron service initialized (no jobs configured)');
  }

  /**
   * Add a new cron job
   * @param {string} name - Job name
   * @param {string} schedule - Cron schedule expression
   * @param {Function} task - Task to execute
   */
  addJob(name, schedule, task) {
    if (this.jobs.has(name)) {
      console.log(`⚠️ Job ${name} already exists, replacing...`);
      this.removeJob(name);
    }

    const job = cron.schedule(schedule, task, {
      scheduled: true,
      timezone: 'America/Sao_Paulo'
    });

    this.jobs.set(name, job);
    console.log(`✅ Cron job '${name}' added with schedule: ${schedule}`);
  }

  /**
   * Remove a cron job
   * @param {string} name - Job name
   */
  removeJob(name) {
    const job = this.jobs.get(name);
    if (job) {
      job.stop();
      this.jobs.delete(name);
      console.log(`🗑️ Cron job '${name}' removed`);
    }
  }

  /**
   * Start all jobs
   */
  startAll() {
    this.jobs.forEach((job, name) => {
      job.start();
      console.log(`▶️ Started job: ${name}`);
    });
  }

  /**
   * Stop all jobs
   */
  stopAll() {
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`⏹️ Stopped job: ${name}`);
    });
  }

  /**
   * List all active jobs
   * @returns {Array} List of job names
   */
  listJobs() {
    return Array.from(this.jobs.keys());
  }
}

export default new CronService();