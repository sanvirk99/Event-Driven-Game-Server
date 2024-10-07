class Queue {
    constructor() {
        this.items = []; // Array to hold the queue elements
    }

    // Add an element to the end of the queue
    enqueue(item) {
        this.items.push(item);
    }

    // Remove and return the front element of the queue
    dequeue() {
        if (this.isEmpty()) {
            throw new Error("Queue is empty");
        }
        return this.items.shift(); // Remove the first element
    }

    // Peek at the front element without removing it
    peek() {
        if (this.isEmpty()) {
            throw new Error("Queue is empty");
        }
        return this.items[0];
    }

    // Check if the queue is empty
    isEmpty() {
        return this.items.length === 0;
    }

    // Get the size of the queue
    size() {
        return this.items.length;
    }

    // Clear the queue
    clear() {
        this.items = [];
    }

    // Make the Queue class iterable
    [Symbol.iterator]() {
        return this.items[Symbol.iterator](); // Return the built-in iterator
    }
}


module.exports = {
    Queue
}