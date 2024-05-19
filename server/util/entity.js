const t1_e = performance.now()

class Physics {
    static throwVelocity = false;
    // physics constants
    // static gravity = -9 .81 * 100 //px/s^2; // assuming 100px = 1m
    static gravity = -32.01 * 100 //px/s^2; // relative to ft instead of m 

    // determines how many times the physics loop runs per second
    static fps = 24;

    // static fps = 32;
    // static fps = 45;
    // static fps = 60;

    // Most laptops do not have sufficient resourses to run at 144 fps
    // static fps = 144;

    // i could take the time to add friction and air resistance but i don't want to
    static coefficient_of_resistance = 0.99;
    static coefficient_of_resistance = 0.94;
    
    // physics setInterval
    static interval = null;

    // the entity that this physics object is attached to
    #entity
    constructor(entity, doesCollide = true, isStatic = false, window = {x: 2000, y: 2000}) {
        
        console.log('Physics Constructed')
        this.#entity = entity;

        this.collision = doesCollide;

        this.static = isStatic;

        // the elasticity of the collision on a 
        // scale from 0 (inelastic) to 1 (elastic)
        // 0.89 is the normalized threshold (this means just do up to 0.89)
        this.collision_elasticity = 0.1; 

        this.gravity = Physics.gravity;

        this.mass = entity.height * entity.width / 10000; // measured in kg
        // this.mass = entity.height * entity.width / 1; // measured in kg

        // measured in px/(s)
        this.velocity = {
            x: 0,
            y: 0
        };

        // measured in px
        this.position = {
            x: 0,
            y: 0
        }

        // stores the previous displacement of the entity
        this.displacement = {
            x: 0,
            y: 0
        }

        // stores the window size
        this.window = window
    }

    // moves the entity based on its velocity
    move() {
        // don't move if the entity is static
        if(this.static) return;

        const t = 1 / Physics.fps;

        // get the next displacement of the entity
        let dX = Physics.get_displacement(this.velocity.x, 0, t);
        let dY = Physics.get_displacement(this.velocity.y, this.gravity, t);
        
        // get the next velocity of the entity
        let vX = Physics.get_finalVelocity(this.velocity.x, 0 , t, dX);
        let vY = Physics.get_finalVelocity(this.velocity.y, this.gravity, t);
        
        // get the displacement of the entity that the current entity is on top of
        if(this.isOnGround()){
            const allCollisions = this.collidesWith([this.#entity], this.position.x, this.position.y - 1, this.position.x, this.position.y)
            allCollisions.forEach((collision) => {
                const other_entity = collision[0];
                const direction = collision[1];
                if(direction == 'top'){
                    dX += other_entity.physics.displacement.x;
                    dY += other_entity.physics.displacement.y;

                    this.displacement.x = dX
                    this.displacement.y = dY
                }
            })
        }

        // set the displacement and velocity of the entity
        this.displacement.x = dX;
        this.displacement.y = dY;
        this.velocity.x = vX * Physics.coefficient_of_resistance;   
        this.velocity.y = vY * Physics.coefficient_of_resistance;

        const stop = 0.1
        if(Math.abs(this.velocity.x) < stop){this.velocity.x = 0}
        if(Math.abs(this.velocity.y) < stop){this.velocity.y = 0}
        
        // move the entity by the displacement (checks for collisions)
        this.translateStep(dX, dY);
    }

    // x and y are additional the displacements
    translateStep(x, y) {        
        // get the new position of the entity
        // this is the value to be updated
        let newX = this.position.x + x;
        let newY = this.position.y + y;

        // when an entity hits a wall (or static entity), the wall returns a force equal to the force of the entity
        const wall_velocity = {
            x: -this.velocity.x,
            y: -this.velocity.y
        }
        
        // ____ check if the entity is colliding with the other entities _____
        if(this.collision){

            // ignore the entity itself when checking for collisions
            // store the entities to ignore in this array
            const ignoreEntities = [this.#entity];
            
            // get all collisions in the path of the entity's trajectory
            // loop through all the collisions until there are no more collisions
            const allCollisions = this.collidesWith(ignoreEntities, newX, newY, this.position.x, this.position.y);
            
            allCollisions.forEach((collision) => {
                const other_entity = collision[0];
                let direction = collision[1];
                let velocity, other_velocity = 0


                // check if the collision is with a static entity
                if(other_entity.physics.static) {
                    
                    // get the new velocity of the entity after the collision
                    [velocity, other_velocity] = this.#collisionVelocities(this.mass, wall_velocity, this.collision_elasticity, direction); // the static entity returns a force equal to the force of the entity (like a wall)
                } else {
                    // get the new velocity of the entities after the collision
                    [velocity, other_velocity] = this.#collisionVelocities(other_entity.physics.mass, other_entity.physics.velocity, other_entity.physics.collision_elasticity, direction);
                }

                // change the position of the entity to the edge of the other entity
                switch(direction){
                    case 'left':
                        newX = other_entity.physics.position.x - this.#entity.width;
                        this.velocity.x = velocity;
                        other_entity.physics.velocity.x = other_velocity;
                        break;
                    case 'right':
                        newX = other_entity.physics.position.x + other_entity.width;
                        this.velocity.x = velocity;
                        other_entity.physics.velocity.x = other_velocity;

                        break;
                    case 'top':
                        newY = other_entity.physics.position.y + other_entity.height;
                        this.velocity.y = velocity;
                        other_entity.physics.velocity.y = other_velocity;
                        break;
                    case 'bottom':
                        newY = other_entity.physics.position.y - this.#entity.height;
                        this.velocity.y = velocity;
                        other_entity.physics.velocity.y = other_velocity;
                        break;
                    default:
                        // console.log(0)
                        break;
                }
            })    
            
            // ____ check if the entity is colliding with the walls and floor _____
            const window_edge = this.window.x - this.#entity.width;

            if (newX < 0) {
                // set the position to the edge of the screen
                newX = 0;

                // get the new velocity of the entity after the collision
                // the wall returns a force equal to the force of the entity
                const [v1, v2] = this.#collisionVelocities(this.mass, wall_velocity, this.collision_elasticity, 'left')
                this.velocity.x = v1;

            } else if (newX > window_edge) {
                // set the position to the edge of the screen
                newX = window_edge;
                const [v1, v2] = this.#collisionVelocities(this.mass, wall_velocity, this.collision_elasticity, 'right')
                this.velocity.x = v1;
            }

            // check if the entity is colliding with the floor
            if (newY < 0) {
                // set the position to the edge of the screen
                newY = 0;
                const [v1, v2] = this.#collisionVelocities(this.mass, wall_velocity, this.collision_elasticity, 'bottom')
                this.velocity.y = v1;
            }
        } 
        
        // update the position of the entity
        this.translate(newX, newY);
    }

    // x and y are the new positions
    // this function is used to set the position of the entity
    translate(x, y) {

        this.position.x = x;
        this.position.y = y;

        // console.log(this.position.x, this.position.y)
    }

    // returns: array of collisions
    // Variables
    // dismiss_entities: array of entities to skip
    collidesWith(dismiss_entities ,e1_x, e1_y, curr1_x, curr1_y) {
        const allCollisions = [];
        Entity.all_entities.forEach((other_entity) => {
            // return if the other entity is the same as this entity
            for(let i = 0; i < dismiss_entities.length; i++){ if(other_entity == dismiss_entities[i]) return;}
            if(!other_entity.physics.collision) return;

            const e2_x = other_entity.physics.position.x;
            const e2_y = other_entity.physics.position.y;
    
            const e1_width = this.#entity.width;
            const e1_height = this.#entity.height;
    
            const e2_width = other_entity.width;
            const e2_height = other_entity.height;
    
            const collides = this.#doesCollide(curr1_x, curr1_y, e1_x, e1_y, e1_width, e1_height, e2_x, e2_y, e2_width, e2_height)

            if (collides){
                // get the direction of the collision
                const direction = this.#collidesFrom(curr1_x, curr1_y, e1_x, e1_y, e1_width, e1_height, e2_x, e2_y, e2_width, e2_height, other_entity, dismiss_entities)
                
                // if the direction is false, then the entity isn't colliding
                if(!direction) return;
                
                // add the collision to the list of collisions
                allCollisions.push([other_entity, direction, Physics.get_DistanceOfTwoPoints(this.position.x, this.position.y, other_entity.physics.position.x, other_entity.physics.position.y)]);
            }
        })

        return allCollisions;
    }

    // takes in current position and next position of moving entity and compares it to the other entity
    #doesCollide(curr1_x, curr1_y, e1_x, e1_y, e1_width, e1_height, e2_x, e2_y, e2_width, e2_height) {
        // console.log(curr1_x, e1_x, curr1_y, e1_y)
        let minX = Math.min(curr1_x, e1_x); 
        let maxX = Math.max(curr1_x, e1_x);

        let minY = Math.min(curr1_y, e1_y);
        let maxY = Math.max(curr1_y, e1_y);

        const width = maxX - minX + e1_width;
        const height = maxY - minY + e1_height;

        return minX < e2_x + e2_width &&
            minX + width > e2_x &&
            minY < e2_y + e2_height &&
            minY + height > e2_y
        
        return e1_x < e2_x + e2_width &&
            e1_x + e1_width > e2_x &&
            e1_y < e2_y + e2_height &&
            e1_y + e1_height > e2_y 

    }

    // NOTE, this is too buggy to keep
    // returns the direction of the collision (assuming there is a collision)
    #collidesFrom(curr1_x, curr1_y, e1_x, e1_y, e1_width, e1_height, e2_x, e2_y, e2_width, e2_height, other_entity, dismiss_entities) {

        // check if the entity is colliding from the x or y direction
        const collide_X = this.#doesCollide(curr1_x, curr1_y, e1_x, curr1_y, e1_width, e1_height, e2_x, e2_y, e2_width, e2_height);
        const collide_Y = this.#doesCollide(curr1_x, curr1_y, curr1_x, e1_y, e1_width, e1_height, e2_x, e2_y, e2_width, e2_height);

        // check if the entity is colliding from both directions
        if(collide_X && collide_Y){
            return 'default'
            // the entity is colliding from both directions
            // console.log(0)
            // array that holds the closest distance to each side of the other entity
            const shift = [/*left, top, bottom, right*/]

            // figure out which side is closest

            // check which side is closest in the x and y direction
            const shiftX = {direction: [], distance: null}
            const shiftY = {direction: [], distance: null}
            // 0 = left, 1 = right
            // 2 = top, 3 = bottom

            const dX_1 = Physics.get_DistanceOfTwoPoints(this.position.x, 0, (other_entity.physics.position.x + other_entity.width), 0)
            const dX_2 = Physics.get_DistanceOfTwoPoints((this.position.x + this.#entity.width), 0, other_entity.physics.position.x, 0)
            if(dX_1 > dX_2){shiftX.direction.push('left'); shiftX.direction.push('right'); shiftX.distance = dX_1 - other_entity.width}
            else{shiftX.direction.push('right'); shiftX.direction.push('left'); shiftX.distance = dX_2 - other_entity.width}

            const dY_1 = Physics.get_DistanceOfTwoPoints(this.position.y, 0, (other_entity.physics.position.y + other_entity.height), 0)
            const dY_2 = Physics.get_DistanceOfTwoPoints((this.position.y + this.#entity.height), 0, other_entity.physics.position.y, 0)
            if(dY_1 < dY_2){shiftY.direction.push('top'); shiftY.direction.push('bottom'); shiftY.distance = other_entity.height - dY_2 }
            else{shiftY.direction.push('bottom'); shiftY.direction.push('top'); shiftY.distance = other_entity.height - dY_1}

            // calculate the area of the entity sticking out of the other entity
            const aX = this.#entity.height * shiftX.distance
            const aY = -(this.#entity.width * shiftY.distance)

            // order the based on the area sizes
            if(aX > aY){shift.push(shiftX.direction[0]);shift.push(shiftY.direction[0]);shift.push(shiftX.direction[1]);shift.push(shiftY.direction[1]);}
            else{shift.push(shiftY.direction[0]);shift.push(shiftX.direction[0]);shift.push(shiftY.direction[1]);shift.push(shiftX.direction[1]);}

            // iterate through the directions and check if there is space to move the entity on each side
            for(let i = 0; i < shift.length; i++){
                let testX = this.position.x;
                let testY = this.position.y;
                switch(shift[i]){
                    case 'left':
                        testX = other_entity.physics.position.x - this.#entity.width;
                        break;
                    case 'right':
                        testX = other_entity.physics.position.x + other_entity.width;
                        break;
                    case 'top':
                        testY = other_entity.physics.position.y + other_entity.height;
                        break;
                    case 'bottom':
                        testY = other_entity.physics.position.y - this.#entity.height;
                        break;
                }

                dismiss_entities.push(other_entity)
                const allCollisions = this.collidesWith(dismiss_entities, testX, testY, this.position.x, this.position.y);
                if(allCollisions.length == 0) return shift[i];
            }
            return 'default'
        }

        // return the direction of the collision
        if(collide_Y){
            if(curr1_y < e1_y){ return 'bottom';}
            else if(curr1_y > e1_y){ return 'top';}
        }

        // return the direction of the collision
        if(collide_X){
            if(curr1_x < e1_x){ return 'left';}
            else if(curr1_x > e1_x){ return 'right';}
        }
        
        return false
    }

    // returns the new velocities of the two entities after the collision 
    // #collisionVelocities(other_entity, direction) {
    #collisionVelocities(m2, other_velocity, e2, direction) {
        let v1 = 0;
        let v2 = 0;
        if(direction == 'left' || direction == 'right'){v1=this.velocity.x; v2=other_velocity.x;}
        if(direction == 'top' || direction == 'bottom'){v1=this.velocity.y; v2=other_velocity.y;}

        // ths returns [vf1, vf2]
        return Physics.get_finalVelocitiesAfterCollision(this.mass, m2, v1, v2, this.collision_elasticity, e2);
    }

    isOnGround() {
        // check if the entity is on the ground
        if(this.position.y === 0) return true

        // check if the entity is colliding with the entity directly below it
        const allCollisions = this.collidesWith([this.#entity], this.position.x, this.position.y - 1, this.position.x, this.position.y)
        if(allCollisions.length > 0) return true

        return false
    }

    hasEntityAbove() {
        // check if the entity is colliding with the entity directly above it
        const allCollisions = this.collidesWith([this.#entity], this.position.x, this.position.y + 5, this.position.x, this.position.y)
        if(allCollisions.length > 0) return true
        return false
    }

    hasEntityLeft() {
        // check if the entity is colliding with the entity directly to the left of it
        const allCollisions = this.collidesWith([this.#entity], this.position.x - 5, this.position.y, this.position.x, this.position.y)
        if(allCollisions.length > 0) return true
        return false
    }

    hasEntityRight() {
        // check if the entity is colliding with the entity directly to the right of it
        const allCollisions = this.collidesWith([this.#entity], this.position.x + 5, this.position.y, this.position.x, this.position.y)
        if(allCollisions.length > 0) return true
        return false
    }

    gravityOn() {this.gravity = Physics.gravity;}

    gravityOff() {this.gravity = 0;}

    // get change in position
    static get_displacement(initial_velocity, acceleration, time) {
        return initial_velocity * time + 0.5 * acceleration * Math.pow(time, 2);
    }

    static get_finalVelocity(initial_velocity, acceleration, time) {
        return initial_velocity + acceleration * time * 2;
    }

    static get_AverageVelocity(displacement, time) {
        return displacement / time;
    }

    static get_AverageAcceleration(initial_velocity, final_velocity, time) {
        return (final_velocity - initial_velocity) / time;
    }

    static get_DistanceOfTwoPoints(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    static get_YFromXLinear(m, x, b) {
        return m * x + b;
    }

    static get_kineticEnergy(m, v) {
        return 0.5 * m * Math.pow(v, 2);
    }

    static get_momentum(m, v) {
        return m * v;
    }

    static get_finalVelocitiesAfterCollision(m1, m2, v1, v2, e1, e2) {
        const e = (e1 + e2) / 2;
        const v1f = (m1 - e * m2) / (m1 + m2) * v1 + (1 + e) * m2 / (m1 + m2) * v2;
        const v2f = (m2 - e * m1) / (m1 + m2) * v2 + (1 + e) * m1 / (m1 + m2) * v1;

        return [v1f, v2f];
    }

    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    // Static variable for the loop because there can only be one loop running at a time
    // this works because a user can only have one avatar (entity) at a given time
    static startLoop() {
        console.log('Physics Loop Started')
        this.endLoop(false);

        // start the loop
        Physics.interval = setInterval(async () => {
            const movementStep = 1000 * (1 / Physics.fps);
            // move entity with key controls
            if(Entity.keyControlEntity){
                const keys = Object.keys(Entity.keyControls);
                keys.forEach((key) => { 
                    if(Entity.keyControls[key] == 0) return;
                    // console.log(key, Entity.keyControls[key])

                    switch(key){
                        case 'up':
                            // console.log('up')
                            Entity.keyControls[key] = 0;
                            break;
                        case 'down':
                            // console.log('down')
                            Entity.keyControls[key] = 0;
                            break;
                        case 'left':
                            if(Entity.keyControls[key]==1) Entity.keyControlEntity.physics.velocity.x -= movementStep;
                            // if(Entity.keyControls[key]==2) {Entity.keyControlEntity.physics.velocity.x = 0 ; Entity.keyControls[key] = 0;}
                            break;
                        case 'right':
                            if(Entity.keyControls[key]==1) Entity.keyControlEntity.physics.velocity.x += movementStep;
                            // if(Entity.keyControls[key]==2) {Entity.keyControlEntity.physics.velocity.x = 0 ; Entity.keyControls[key] = 0;}
                            break;
                        case 'jump':
                            if(Entity.keyControls[key]==1) if(Entity.keyControlEntity.physics.isOnGround()) Entity.keyControlEntity.physics.velocity.y = 1500;
                            if(Entity.keyControls[key]==2) {/* Entity.keyControlEntity.physics.velocity.y = 0*/ ; Entity.keyControls[key] = 0;}
                            break;
                    }
                })
            }

            // move all the entities
            Entity.all_entities.forEach( async (entity, i) => {
                entity.physics.move();

                // update the user or other entity in the database
                
                const test = await entity.physics.update()

                // check if test is a promise
                if(test && test.then) await test
            })

        }, 1000 / Physics.fps); // loops every 1/fps seconds
    }

    static endLoop(log = true) {
        if(log) console.log('Physics Loop Ended')
        clearInterval(Physics.interval);
    }

    async update() {
        // get the position of all the entities
        // polymorphism overrides the default method
        // console.log(1)
        return null
    }

}

class Entity {
    // holds all entities
    static all_entities = [];
    
    static keyControlEntity = null;
    static keyControls = {
        'up': 0,
        'down': 0,
        'left': 0,
        'right': 0,
        'jump': 0,
    };

    debug = false;

    constructor(width = 100, height = 100, id, window = {x: 1000, y: 1000}){
        console.log('Entity Constructed');

        // this.height = Math.random() * 100 + 50;
        // this.width = this.height;

        // =-=-=-=-=-=-=-=-= NOTE =-=-=-=-=-=-=-=-=
        // random height and width is causing issues
        this.height = height;
        this.width = width;

        this.id = id;

        // add physics
        this.physics = new Physics(this);
        this.physics.window = window;

        // add this entity to the list of all entities
        Entity.all_entities.push(this);
    }

    delete() {
        // remove the entity from the list of all entities
        Entity.all_entities = Entity.all_entities.filter((entity) => entity != this);
    }

    static addKeyControls(entity){
        // add key controls
        Entity.keyControlEntity = entity;
        
    }
}

// this just makes it easier to differentiate
class StaticEntity extends Entity {
    constructor(parentElement, width = 500, height = 100, id){
        super(parentElement, width, height, id);
        this.physics.static = true;
    }
}

// export as a node module
module.exports = {Entity, StaticEntity, Physics};