// Webhook retry queue logic

interface RetryTask {
    webhookId: string;
    eventType: string;
    payload: string;
    attempts: number;
    lastAttemptAt: number;
    nextAttemptAt: number;
}

export class RetryQueue {
    private queue: RetryTask[] = [];
    private maxRetries = 3;
    private baseDelay = 5000; // 5 seconds

    constructor(
        private onRetry: (task: RetryTask) => Promise<boolean>,
        private onFailed: (task: RetryTask) => Promise<void>
    ) {
        // Check queue periodically
        setInterval(() => this.processQueue(), 10000); // Every 10 seconds
    }

    async add(task: Omit<RetryTask, "attempts" | "lastAttemptAt" | "nextAttemptAt">) {
        const retryTask: RetryTask = {
            ...task,
            attempts: 1,
            lastAttemptAt: Date.now(),
            nextAttemptAt: Date.now() + this.baseDelay,
        };
        this.queue.push(retryTask);
    }

    private async processQueue() {
        const now = Date.now();
        const tasksToProcess = this.queue.filter(t => t.nextAttemptAt <= now);

        // Remove tasks from main queue before processing
        this.queue = this.queue.filter(t => t.nextAttemptAt > now);

        for (const task of tasksToProcess) {
            task.attempts++;
            const success = await this.onRetry(task);

            if (!success) {
                if (task.attempts < this.maxRetries) {
                    // Re-add to queue with exponential backoff
                    task.lastAttemptAt = now;
                    task.nextAttemptAt = now + Math.pow(2, task.attempts) * this.baseDelay;
                    this.queue.push(task);
                } else {
                    // Permanently failed
                    await this.onFailed(task);
                }
            }
        }
    }
}
