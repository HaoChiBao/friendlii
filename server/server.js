const {Entity, StaticEntity, Physics} = require('./util/entity.js')

// websocket express server
const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files (if needed)
app.use(express.static('public'));

const client_rooms = {
    defaultRoom: {
        clients: [
            // list of client ids
        ],
    },
}

// Broadcast to all connected clients, except the sender
function broadcast(ws, message) {
    wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// user physics
class UserEntity extends Entity {

    constructor(width = 100, height = 100, id, ws = null, skin = 0){
        super(width, height, id);
        this.init()
        
        this.ws = ws

        this.skin = skin
        this.animationFrame = 0
        this.facingLeft = true
    }
    
    async init(){
        this.physics = new UserPhysics(this)
        Entity.addKeyControls(this);
    }
}

class UserPhysics extends Physics{
    constructor(user_entity){
        super(user_entity)
        this.user_entity = user_entity

        this.keyControls = {
            'up': 0,
            'down': 0,
            'left': 0,
            'right': 0,
            'jump': 0,
        }
    }
    
    // override the update method to update the users position its the db
    async update(){
        if(true){ //verify websocket connection
            try{

                // update the user data
                // this.user_entity.ws.send(JSON.stringify({
                //     action: 'update',
                //     data: this.position,
                //     timeStamp: Date.now()
                // }))
                if(this.velocity.x > 0) this.user_entity.facingLeft = false
                if(this.velocity.x < 0) this.user_entity.facingLeft = true
                // console.log(this.user_entity.facingLeft)

                if(this.hasEntityAbove()){
                    this.user_entity.animationFrame = 1
                }else if(this.hasEntityLeft()){
                    this.user_entity.animationFrame = 2
                    this.facingLeft = true
                }else if(this.hasEntityRight()){
                    this.user_entity.animationFrame = 2
                    this.facingLeft = false
                } else {
                    this.user_entity.animationFrame = 0
                }

            } catch(e) {
                console.log(e)
            }
        }
    }

    static startLoop() {
        console.log('Physics Loop Started')
        this.endLoop(false);

        
        // start the loop
        Physics.interval = setInterval(async () => {
            const movementStep = 1000 * (1 / Physics.fps);

            // move all the entities
            Entity.all_entities.forEach( async (entity, i) => {

                const keys = Object.keys(entity.physics.keyControls);
                keys.forEach((key) => {
                    // console.log(entity.physics.keyControls[key])
                    if(entity.physics.keyControls[key] == 0) return;

                    switch(key){
                        case 'up':
                            // console.log('up')
                            entity.physics.keyControls[key] = 0;
                            break;
                        case 'down':
                            // console.log('down')
                            entity.physics.keyControls[key] = 0;
                            break;
                        case 'left':
                            if(entity.physics.keyControls[key]==1) entity.physics.velocity.x -= movementStep;
                            // if(entity.physics.keyControls[key]==2) {entity.physics.velocity.x = 0 ; entity.physics.keyControls[key] = 0;}
                            break;
                        case 'right':
                            if(entity.physics.keyControls[key]==1) entity.physics.velocity.x += movementStep;
                            // if(entity.physics.keyControls[key]==2) {entity.physics.velocity.x = 0 ; entity.physics.keyControls[key] = 0;}
                            break;
                        case 'jump':
                            if(entity.physics.keyControls[key]==1) if(entity.physics.isOnGround()) entity.physics.velocity.y = 1500;
                            if(entity.physics.keyControls[key]==2) {/* entity.physics.velocity.y = 0*/ ; entity.physics.keyControls[key] = 0;}
                            break;
                    }
                })

                entity.physics.move();

                // update the user or other entity in the database
                
                const test = await entity.physics.update()

                // check if test is a promise
                if(test && test.then) await test
            })

            Entity.all_entities.forEach((entity, i) => {
                // console.log(Entity.all_entities)

                // return
                entity.ws.send(JSON.stringify(
                    {
                        action: 'update',
                        // blob Entity.all_entities
                        data: Entity.all_entities.map((entity) => {
                            return {
                                id: entity.id,
                                position: entity.physics.position,
                                skin: entity.skin,
                                animationFrame: entity.animationFrame,
                                facingLeft: entity.facingLeft,
                            }
                        }),
                        timeStamp: Date.now()
                    }
                ))

            })
        }, 1000 / Physics.fps); // loops every 1/fps seconds
    }
}

// WebSocket connection handling
wss.on('connection', (ws) => {
    // generate unique id for each client
    ws.id = Math.random().toString(36).substr(2, 9);
    console.log(`Client id: ${ws.id} connected`);

    let room = 'defaultRoom';
    let entity = new UserEntity(100, 100, ws.id, ws)
    
    client_rooms[room].clients.push(ws);
    
    // Send a welcome message
    ws.send(
        // send as buffer
        JSON.stringify({
            action: 'Welcome',
            data: ws.id,
        })
    );
    
    ws.on('message', (message) => {
        const messageObj = JSON.parse(message)
        const action = messageObj.action
        const data = messageObj.data
        switch(action){
            case 'keyControls':
                entity.physics.keyControls = data
                break
            case 'connect':
                entity.skin = data.skin
                break
        }
        
        // console.log(`message from client: ${ws.id}`);
    
        // Broadcast the message to all clients
        // broadcast(ws, message);
    });
    
    ws.on('close', () => {
        console.log(`Client: ${ws.id} disconnected`);
        
        // remove client from defaultRoom
        client_rooms[room].clients = client_rooms[room].clients.filter((client) => client !== ws.id);
        entity.delete()

        // Broadcast the message to all clients
        client_rooms[room].clients.forEach((client) => {
            client.send(
                JSON.stringify({
                    action: 'user_disconnect',
                    data: ws.id,
                    timeStamp: Date.now()
                })
            );
        });

    });
    
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

UserPhysics.startLoop()