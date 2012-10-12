function Player(x, y){
    this.x = x;
    this.y = y;
    this.r = PLAYER_RADIUS;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.life = 0; 
    this.maxLife = 0;
}
Player.prototype.accelerate = function(dt){
    //orientation
    x = this.r * Math.cos(this.angle * Math.PI / 180);
    y = this.r * Math.sin(this.angle * Math.PI / 180);
    //unit vector
    ux = x / this.r;
    uy = y / this.r;
    //updates
    this.vx += ux * PLAYER_ACCELERATION * dt;
    this.vy += uy * PLAYER_ACCELERATION * dt;
}
Player.prototype.update = function(dt){
    //updates
    this.angle = 180 / Math.PI *Math.atan2(mouseY-this.y, mouseX - this.x);
    this.x += this.vx * dt;
    this.y += this.vy * dt;   
}

Player.prototype.reduceLives = function(lives){
    this.life -= 1;
}

Player.prototype.addLives = function(lives){
    this.life += 1;
    this.maxLife += 1;
}

var _canvas = null;
var _buffer = null;
var canvas = null;
var buffer = null;

isdown = {w: 0, e: 0, q: 0, space: 0}; 
var ammos = new Array();
var ufos = new Array();

var this_frame = new Date();
var prev_frame = new Date();

var PLAYER_ACCELERATION = 500;
var PLAYER_RADIUS = 50;
var AMMO_VELOCITY = 900;
var SHOOT_WAIT = 500;
var AMMO_RADIUS = 5;
var UFO_RADIUS = 25;

var gameover = 0;
var level = 0;
var score = 0;
var shootTime = 0;
var mouseX = 0;
var mouseY = 0;
var turrets = 1;
var kills = 0;
var bonus = 0;
var shootWaitReduced = 0;
var bonusEnemySpeed = 0;
var bonusTurret = 0;
var bonusRof = 0;
var turretsWidth = 10;
var turretStep = 0;

document.addEventListener('keydown', checkKeyDown, false);
document.addEventListener('keyup', checkKeyUp, false);
document.addEventListener('mousemove', checkMouseMove, false);

function checkMouseMove(e){    
    if(e.offsetX) {
        mouseX = e.offsetX;
        mouseY = e.offsetY;
    }
    else if(e.layerX){
        mouseX = e.layerX;
        mouseY = e.layerY;
    }
}

function checkKeyDown(e) {
    var keyID = e.keyCode || e.which;
    if (keyID === 87) { //W 
        e.preventDefault();
        isdown.w = 1;
    }
    else if (keyID === 69) { //E
        e.preventDefault();
        isdown.e = 1;
    }    
    else if (keyID === 81) { //Q
        e.preventDefault();
        isdown.q = 1;
    }            
    else if (keyID === 32) { //spacebar
        e.preventDefault();
        isdown.space = 1;
    }
}

function checkKeyUp(e) {
    var keyID = e.keyCode || e.which;
    if (keyID === 49){ //1
        if(bonus >= 20){
            if (turrets < 7){
                turrets *= 2;
                bonus -= 20;
            }
        }
    }    
    else if (keyID === 50){ //2
        if(bonus >= 20){
            if (shootWaitReduced < 350){
                shootWaitReduced += 50;
                bonus -= 20;
            }
        }
    }
    else if (keyID === 87) { //W 
        e.preventDefault();
        isdown.w = 0;
    }
    else if (keyID === 69) { //E
        e.preventDefault();
        isdown.e = 0;
    }    
    else if (keyID === 81) { //Q
        e.preventDefault();
        isdown.q = 0;
    }     
    else if (keyID === 32) { //spacebar
        e.preventDefault();
        isdown.space = 0;
    }
}

function addUfo(x1, y1, v, life1){
    ufos.push({x:x1, y:y1, maxv: v, maxLife: Math.max(life1, 1), life: Math.max(life1, 1)});
}

function removeUfo(i){
    ufos.splice(j, 1);
    kills += 1;
    bonus += 1;   
    score += Math.pow(level, 2);    
}

function nextLevel(){
    level += 1;
    for(i=0; i<level; i++){
        r = Math.floor(Math.random() * 4);
        if(r == 0){
            x = Math.floor(Math.random() * 800);
            y = UFO_RADIUS;
        }
        if(r == 1){
            x = Math.floor(Math.random() * 800);
            y = 600 - UFO_RADIUS;
        }
        if(r == 2){
            x = 800 - UFO_RADIUS;
            y = Math.floor(Math.random() * 600);
        }
        if(r == 3){
            x = UFO_RADIUS;
            y = Math.floor(Math.random() * 600);
        }        
        addUfo(x, y, 5 * level, Math.floor(level / 3));
    }
}

function circle_circle_collision(c1x, c1y, c1r, c2x, c2y, c2r){
    if(Math.pow((c2x - c1x), 2) + Math.pow((c1y - c2y), 2) <= Math.pow((c1r + c2r), 2)){
        return 1;
    }
    return 0;
}

    
//returns array of objects with x1, y1, x2, y2 properties
function generateLightning(startX, startY, endX, endY, iterations){
    var segments = new Array();
    var offset = 32;
    segments.push({x1: startX, y1: startY, x2: endX, y2: endY});
    for(divisions = 0; divisions < iterations; divisions++){
        var splitSegments = new Array();
        for(i = 0; i < segments.length; i++){        
            //midpoint of the segment
            var midX = (segments[i].x1 + segments[i].x2) / 2;
            var midY = (segments[i].y1 + segments[i].y2) / 2;

            //angle of the segment
            var rad = Math.atan2(segments[i].y2 - segments[i].y1, segments[i].x2 - segments[i].x1);
            
            //offset the midpoint perpendicularly
            if(Math.floor(Math.random() * 2) < 1){
                offset *= -1;
            }
            midX += Math.cos(Math.PI/2 + rad) * offset;
            midY += Math.sin(Math.PI/2 + rad) * offset;
            
            splitSegments.push({x1: segments[i].x1, y1: segments[i].y1, x2: midX, y2: midY});
            splitSegments.push({x1: midX, y1: midY, x2: segments[i].x2, y2: segments[i].y2});            
            
            //segments.splice(i, 1);
        }
        segments = [];
        offset /= 2;
        for(i = 0; i < splitSegments.length; i++){
            segments.push(splitSegments[i]);
        }
        
    }
    /*
    var points = new Array();    
    for(i = 0; i < segments.length; i++){
        points.push({x: segments[i].x1, y: segments[i].y1});
    }
    */
    return segments;
} 

function drawHealthBar(ctx, x, y, r, maxLife, life, width, height){
    ctx.fillStyle = "rgb(255,0,0)";
    ctx.beginPath();
    ctx.fillRect(x - width / 2, y - r - height * 2, width, height);
    ctx.closePath();
    
    ctx.fillStyle = "rgb(0,255,0)";
    ctx.beginPath();
    ctx.fillRect(x - width / 2, y - r - height * 2, life * width / maxLife, height);
    ctx.closePath();  
}
    
function Game(){
	this.gameLoop = null;
	var self = this;
	var lightning = new Array();
    var bjenn = new Player(400, 300);
    var lightningTime = 0;
    var lightningAge = 0;
	this.Init = function(){
		_canvas = document.getElementById('canvas');
		if (_canvas && _canvas.getContext){
			canvas = _canvas.getContext('2d');
			
			_buffer = document.createElement('canvas');
			_buffer.width = _canvas.width;
			_buffer.height = _canvas.height;
			buffer = _buffer.getContext('2d');
			
			buffer.strokeStyle = "rgb(255, 255, 255)";
			buffer.fillStyle = "rgb(255, 255, 255)";
			buffer.font = "bold 12px sans-serif";     
		}
	}
	
	this.Run = function(){		
		if(canvas != null){
			self.gameLoop = setInterval(self.Loop, 1);
		}	
	}
	
	this.Update = function(){
        prev_frame = this_frame;
        this_frame = new Date();
        dt = (this_frame.getTime() - prev_frame.getTime()) / 1000;
        
		if(isdown.w){
            bjenn.accelerate(dt);
        }   
        bjenn.update(dt);


        if(isdown.e){
            if(this_frame.getTime() - shootTime > SHOOT_WAIT - shootWaitReduced){
                for(i = 1; i<= turrets; i++){
                    turretStep = turretsWidth/turrets;
                    x = bjenn.x - bjenn.x + bjenn.r * Math.cos(((bjenn.angle + turretStep * i) - turretsWidth ) * Math.PI / 180);
                    y = bjenn.y - bjenn.y + bjenn.r * Math.sin(((bjenn.angle + turretStep * i) - turretsWidth) * Math.PI / 180);
                    normik = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
                    ux = x / normik;
                    uy = y / normik;
                    vx = ux * AMMO_VELOCITY;
                    vy = uy * AMMO_VELOCITY;
                    ammos.push({vy: vy, vx: vx, r: AMMO_RADIUS, y: bjenn.y + bjenn.r * Math.sin(((bjenn.angle + turretStep * i) - turretsWidth ) * Math.PI / 180), x: bjenn.x + bjenn.r * Math.cos(((bjenn.angle + turretStep * i) - turretsWidth) * Math.PI / 180)});                
                }
                shootTime = this_frame.getTime();
            }                      
        }
        
        if(isdown.q){
            if(this_frame.getTime() - shootTime > SHOOT_WAIT - shootWaitReduced){
                //var length = Math.sqrt(Math.pow(bjenn.x - mouseX, 2) + Math.pow(bjenn.y - mouseY, 2));
                lightning = generateLightning(bjenn.x, bjenn.y, mouseX, mouseY, 7);
                lightningTime = this_frame.getTime();
                shootTime = this_frame.getTime();
            }
        }
        lightningAge = this_frame.getTime() - lightningTime;
        if(lightningAge > 250){
            lightning = [];
        }
        
        if(ufos.length == 0)
        {   
            nextLevel();
            bjenn.addLives(1);
        }        

        
        for(i = 0; i < ammos.length; i++){
            ammos[i].x += ammos[i].vx * dt;   
            ammos[i].y += ammos[i].vy * dt;  
            if(ammos[i].x < 0 || ammos[i].x > 800 || ammos[i].y < 0 || ammos[i].y > 600){
                ammos.splice(i, 1);
            }
        }
        for(j = 0; j < ufos.length; j++){   
            var remove_ammos = new Array();
            for(i = 0; i < ammos.length; i++){
                if(circle_circle_collision(ammos[i].x, ammos[i].y, ammos[i].r, ufos[j].x, ufos[j].y, UFO_RADIUS)){
                    ufos[j].life -= 1;
                    remove_ammos.push(i);
                    if(ufos[j].life == 0){
                        removeUfo(j);
                    }
                }            
            } 
            for(i = 0; i < remove_ammos.length; i++){
                ammos.splice(remove_ammos[i], 1);
            }
        }
        var done = 0;
        for(i = 0; i < lightning.length; i++){
            for(j = 0; j < ufos.length; j++){
                if(circle_circle_collision(lightning[i].x1, lightning[i].y1, 0, ufos[j].x, ufos[j].y, UFO_RADIUS)){            
                    done = 1;
                    break;
                }
            }
            if(done){
                lightning.splice(i, lightning.length - i);
                removeUfo(j);
                break;
            }
        }
        
        for(i = 0; i < ufos.length; i++){                            
            x = bjenn.x - ufos[i].x;
            y = bjenn.y - ufos[i].y;
            normik = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
            ux = x / normik;
            uy = y / normik;
            vx = ux * ufos[i].maxv;
            vy = uy * ufos[i].maxv;
            ufos[i].x += vx * dt;
            ufos[i].y += vy * dt;
            if(circle_circle_collision(ufos[i].x, ufos[i].y, UFO_RADIUS, bjenn.x, bjenn.y, bjenn.r)){
                ufos.splice(i, 1);
                bjenn.reduceLives(1); 
            }
        }
        if(bjenn.life < 1){
            gameover = 1;
        }
	}
    	
	this.Draw = function(){
		buffer.clearRect(0, 0, _buffer.width, _buffer.height);
		canvas.clearRect(0, 0, _canvas.width, _canvas.height);
		
        buffer.strokeStyle = "rgb(255, 255, 255)";
        //player circle
        buffer.beginPath();
        buffer.arc(bjenn.x, bjenn.y, bjenn.r, 0, Math.PI*2, true);
        buffer.stroke();
        buffer.closePath(); 
        
        //line inside player circle
        buffer.beginPath();
        buffer.lineCap = "round";
        buffer.moveTo(bjenn.x , bjenn.y);
        buffer.lineTo(bjenn.x + bjenn.r * Math.cos(bjenn.angle * Math.PI / 180), bjenn.y + bjenn.r * Math.sin(bjenn.angle * Math.PI / 180));
        buffer.stroke();         
        buffer.closePath();   
        
        //player healthbar
        drawHealthBar(buffer, bjenn.x, bjenn.y, bjenn.r, bjenn.maxLife, bjenn.life, 70, 6);
   
        
        //ammos
        for(var i = 0; i < ammos.length; i++){
            buffer.beginPath();
            buffer.arc(ammos[i].x, ammos[i].y, ammos[i].r, 0, Math.PI*2, true);
            buffer.stroke();
            buffer.closePath(); 
        }   
        
        //lightning
        buffer.beginPath();
        buffer.lineWidth = 2;
        if(lightningAge < 150){
            buffer.shadowBlur= 6;
        }
        buffer.shadowColor="yellow";     
        buffer.strokeStyle = "rgb("+(255-lightningAge) +","+(255-lightningAge) +","+(255-lightningAge)+")";
        for(i = 0; i < lightning.length; i++){
            buffer.moveTo(lightning[i].x1, lightning[i].y1);
            buffer.lineTo(lightning[i].x2, lightning[i].y2);
                
        }
        buffer.stroke();  
        buffer.closePath();  
        buffer.shadowBlur = 0;
        buffer.lineWidth = 1;
        
        //jufos
        for(var i = 0; i < ufos.length; i++){   
            //circle
            buffer.fillStyle = "rgb(127, 0, 255)";
            buffer.beginPath();
            buffer.arc(ufos[i].x, ufos[i].y, UFO_RADIUS, 0, Math.PI*2, true);            
            buffer.fill();
            buffer.closePath();
            
            //healthbars
            drawHealthBar(buffer, ufos[i].x, ufos[i].y, UFO_RADIUS, ufos[i].maxLife, ufos[i].life, 70, 6);
        }   
        
        //text
		buffer.fillStyle = "rgb(255, 255, 255)";
        buffer.fillText("level: "+ level, 18, 16);
        buffer.fillText("scoor : "+ score, 78, 16);
        buffer.fillText("bonus available: "+ Math.floor(bonus/20), 228, 16);
        buffer.fillText("turrets: "+ turrets, 528, 16);
        buffer.fillText("rate of fire: "+ ((SHOOT_WAIT-shootWaitReduced)/1000), 628, 16);        
		buffer.fillStyle = "rgb(255, 255, 255)";

		canvas.drawImage(_buffer, 0, 0);
	}
	
	this.Loop = function(){
        if(!gameover){
            self.Update();
            self.Draw();	
        }
	}
}