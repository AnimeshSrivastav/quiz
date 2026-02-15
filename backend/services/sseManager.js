
class SSEManager {
  constructor() {
    this.clients = new Map();
  }

  
  addClient(id, res) {
    this.clients.set(id, res);

    res.on('close', () => {
      this.clients.delete(id);
      console.log(`SSE client disconnected: ${id} (${this.clients.size} online)`);
    });

    console.log(`SSE client connected: ${id} (${this.clients.size} online)`);
  }

 
  broadcast(event, data) {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    let delivered = 0;

    this.clients.forEach((client, id) => {
      try {
        client.write(message);
        delivered++;
      } catch (err) {
        console.error(`Failed to send to client ${id}:`, err.message);
        this.clients.delete(id);
      }
    });

    console.log(`Broadcast "${event}" to ${delivered}/${this.clients.size} clients`);
  }

  getClientCount() {
    return this.clients.size;
  }
}

module.exports = new SSEManager();
