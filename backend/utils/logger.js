
class CircularBuffer {

    constructor(size=30) {
      this.size = size;         
      this.buffer = new Array(size);  
      this.head = 0;            // Points to the position of the next item to be added
      this.tail = 0;            // Points to the position of the oldest item
      this.count = 0;           // Number of elements currently in the buffer
    }
  
    // Adds an item to the buffer
    push(item) {
      if (this.count < this.size) {
        this.buffer[this.head] = item;
        this.head = (this.head + 1) % this.size;  // Wrap around if we reach the end of the buffer
        this.count++;
      } else {
        // If the buffer is full, overwrite the oldest item
        this.buffer[this.head] = item;
        this.head = (this.head + 1) % this.size;
        this.tail = (this.tail + 1) % this.size;  // Move tail to the next oldest item
      }
    }
  
    // Returns a string representation of the buffer's current contents in insertion order
    items() {
      if (this.count === 0) return '';
  
      let result = [];
      let i = this.tail;
  
      // Iterate through the buffer in the order of insertion
      for (let j = 0; j < this.count; j++) {
        result.push(this.buffer[i]);
        i = (i + 1) % this.size;  // Wrap around if necessary
      }
      return result
    }

    toString() {
        if (this.count === 0) return '';
    
        let result = [];
        let i = this.tail;
    
        // Iterate through the buffer in the order of insertion
        for (let j = 0; j < this.count; j++) {
          result.push(this.buffer[i]);
          i = (i + 1) % this.size;  // Wrap around if necessary
        }
        return result.join('\n')
    }
}

class Logger {

    constructor(size=30){
        
        this.buffer=new CircularBuffer(size)

    }
    getMessages(){

        return this.buffer.items()
    }
    
    log(message){
        this.buffer.push(message)
    }

    toString(){
        return this.buffer.toString()
    }
}


module.exports = {
    Logger,
}