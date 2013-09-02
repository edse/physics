// polyfill for animation frame
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame || 
    window.webkitRequestAnimationFrame || 
    window.mozRequestAnimationFrame    || 
    window.oRequestAnimationFrame      || 
    window.msRequestAnimationFrame     || 
    function(/* function */ callback, /* DOMElement */ element){
      window.setTimeout(callback, 1000 / 60);
    };
})();


// constructor
function Tool() {
  this.initialState = null;
  this.loadSavedWorlds();
  this.init();
  this.update();
}

//init function
Tool.prototype.init = function() {

  b2Vec2 = Box2D.Common.Math.b2Vec2;
  b2AABB = Box2D.Collision.b2AABB;
  b2BodyDef = Box2D.Dynamics.b2BodyDef;
  b2Body = Box2D.Dynamics.b2Body;
  b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
  b2Fixture = Box2D.Dynamics.b2Fixture;
  b2World = Box2D.Dynamics.b2World;
  b2MassData = Box2D.Collision.Shapes.b2MassData;
  b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
  b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
  b2DebugDraw = Box2D.Dynamics.b2DebugDraw;
  b2MouseJointDef = Box2D.Dynamics.Joints.b2MouseJointDef;
  
  this.scale = 30;
  this.center = {x: 0, y:0}

  this.bodies2delete = [];
  this.building = null;
  this.built = [];
  
  this.image = new Image();
  this.image.src = "/editor/img/09.png";

  this.canvas = document.getElementById("canvas");
  this.ctx = this.canvas.getContext("2d");

  this.canvas.width = window.innerWidth;
  this.canvas.height = window.innerHeight;

  this.world = new b2World(new b2Vec2(0, 0)//gravity
  , true //allow sleep
  );

  this.affectedBody = Array();
  this.entryPoint = Array();
  this.exitPoint = Array();
  this.affectedByLaser = Array();

  console.log(this.initialState);
  if(this.initialState==null){
    this.fixDef = new b2FixtureDef;
    this.fixDef.density = 1;
    this.fixDef.friction = 0.5;
    this.fixDef.restitution = 0.5;
  
    this.bodyDef = new b2BodyDef;
  
    //create ground
    this.bodyDef.type = b2Body.b2_staticBody;
    this.fixDef.shape = new b2PolygonShape;
    this.fixDef.shape.SetAsBox(26, 1);
    
    this.bodyDef.position.Set(26, 0);
    this.world.CreateBody(this.bodyDef).CreateFixture(this.fixDef);
  
    this.bodyDef.position.Set(26, 76);
    this.world.CreateBody(this.bodyDef).CreateFixture(this.fixDef);
  
    this.fixDef.shape.SetAsBox(1, 38);
    this.bodyDef.position.Set(0, 38);
    this.world.CreateBody(this.bodyDef).CreateFixture(this.fixDef);
  
    this.bodyDef.position.Set(52, 38);
    this.world.CreateBody(this.bodyDef).CreateFixture(this.fixDef);
    
  
    //Complex bodies code
    var entity = {id: 4, x: 10, y: 10, polys: [
    [{x: 432, y: 1096}, {x: 436, y: 1096}, {x: 435, y:1100}, {x: 432, y:1100}],
    [{x: 367, y: 1096}, {x: 367, y: 1100}, {x: 364, y:1100}, {x: 363, y:1096}],
    [{x: 436, y: 1096}, {x: 436, y: 1121}, {x: 435, y:1120}, {x: 435, y:1100}],
    [{x: 363, y: 1096}, {x: 364, y: 1100}, {x: 364, y:1120}, {x: 363, y:1121}],
    [{x: 363, y: 1121}, {x: 364, y: 1120}, {x: 435, y:1120}, {x: 436, y:1121}]
    ]};
    var entity = {id: 4, x: 10, y: 10, polys: [
      [{x: -1, y: -1}, {x: 1, y: -1}, {x: 1, y: 1}, {x: -1, y: 1}], // box
      [{x: 1, y: -1.5}, {x: 2, y: 0}, {x: 1, y: 1.5}]  // arrow
    ]};
    for (var j = 0; j < entity.polys.length; j++) {
      var points = entity.polys[j];
      var vecs = [];
      for (var i = 0; i < points.length; i++) {
        var vec = new b2Vec2();
        vec.Set(points[i].x, points[i].y);
        vecs[i] = vec;
      }
      this.bodyDef.type = b2Body.b2_dynamicBody;
      this.bodyDef.position.Set(3, 3);
      this.fixDef.shape = new b2PolygonShape;
      this.fixDef.shape.SetAsArray(vecs, vecs.length);
      this.world.CreateBody(this.bodyDef).CreateFixture(this.fixDef);
    }

    //create some objects
    this.bodyDef.type = b2Body.b2_dynamicBody;
    var rad = 1;
    var data = { 
      imgsrc: "/editor/img/ball.png",
      imgsize: 80,
      bodysize: rad + 0.1
    }
    for (var i = 0; i < 41; ++i) {
      if (i == 40){
        rad = 0.15;
        data = { 
          imgsrc: "/editor/img/ball.png",
          imgsize: 80,
          bodysize: rad + 0.1,
          ball: 1
        }
      }
      //radius
      this.fixDef.shape = new b2CircleShape(rad + 0.1);
      this.bodyDef.position.x = Math.random() * 40 + 1;
      this.bodyDef.position.y = Math.random() * 30 + 5;
      this.bodyDef.userData = data;
      
      var b = this.world.CreateBody(this.bodyDef);
      b.CreateFixture(this.fixDef);
      //b.SetLinearDamping(3);
      //b.SetAngularDamping(3);
      if (i == 40) {
        //b.SetLinearDamping(2);
        //b.SetAngularDamping(2);
        this.ball = b;
      }
    }
    
    this.selectedBody = this.ball;
    this.selectedBody.SetPosition(new b2Vec2(20, 20));
  
  }else{
    for(var i=0; i<this.initialState.body.length; i++) {
      console.log(this.initialState.body[i]);
      var body = this.initialState.body[i];
      this.fixDef = new b2FixtureDef;
      this.fixDef.density = body.density;
      this.fixDef.friction = body.friction;
      this.fixDef.restitution = body.restitution;
      this.bodyDef = new b2BodyDef;
      this.bodyDef.type = body.type;
      this.bodyDef.userData = body.userData;
      this.bodyDef.position.x = body.position.x;
      this.bodyDef.position.y = body.position.y;
      if(body.fixture[0].circle){
        console.log("circle");
        this.fixDef.shape = new b2CircleShape(body.fixture[0].circle.radius);
        this.world.CreateBody(this.bodyDef).CreateFixture(this.fixDef);
      }else if(body.fixture[0].polygon){
        console.log("polygon");
        console.log(body.fixture[0].polygon.vertices);
        var vecs = [];
        for (var j=0; j<body.fixture[0].polygon.vertices.length; j++) {
          var points = body.fixture[0].polygon.vertices[j];
          var vec = new b2Vec2();
          vec.Set(points.x, points.y);
          vecs.push(vec);
          //var vecs = [];
          /*
          for (var i = 0; i < points.length; i++) {
            var vec = new b2Vec2();
            vec.Set(points[i].x, points[i].y);
            vecs.push(vec);
            console.log(vec)
          }
          */
        }
        this.fixDef.shape = new b2PolygonShape;
        this.fixDef.shape.SetAsArray(vecs, vecs.length);
        this.world.CreateBody(this.bodyDef).CreateFixture(this.fixDef);
      }
      
    }
  }

  /*
  var vecs = new Array();
  vecs[0] = new b2Vec2(20, 20);
  vecs[1] = new b2Vec2(30, 20);
  vecs[2] = new b2Vec2(30, 30);
  vecs[3] = new b2Vec2(20, 30);
  */
 
 /*
  vecs[0] = new b2Vec2(38.86467972822295, 44.14008236955851);
  vecs[1] = new b2Vec2(42.8452622524948, 34.14008236955851);
  vecs[2] = new b2Vec2(44.742951303720474, 34.14008236955851);
  vecs[3] = new b2Vec2(44.742951303720474, 44.14008236955851);

  var centre=findCentroid(vecs,vecs.length);
  
  for(var i=0; i<vecs.length; i++) {
    vecs[i].Subtract(centre);
  }
  
  console.log("test: "+vecs.length);
  this.bodyDef = new b2BodyDef;
  this.bodyDef.type = b2Body.b2_dynamicBody;
  //this.bodyDef.position.x = Math.random() * 40 + 1;
  //this.bodyDef.position.y = Math.random() * 30 + 5;
  this.bodyDef.position.Set(centre.x, centre.y);
  this.fixDef.shape = new b2PolygonShape;
  this.fixDef.shape.SetAsArray(vecs, vecs.length);
  this.world.CreateBody(this.bodyDef).CreateFixture(this.fixDef);
  */


  //setup debug draw
  this.debugDraw = new b2DebugDraw();
  this.debugDraw.SetSprite(document.getElementById("canvas").getContext("2d"));
  this.debugDraw.SetDrawScale(this.scale);
  this.debugDraw.SetFillAlpha(0.5);
  this.debugDraw.SetLineThickness(1.0);
  this.debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
  this.world.SetDebugDraw(this.debugDraw);

  //mouse
  //mouse
  this.mouseX;
  this.mouseY;
  this.mousePVec;
  this.isMouseDown;
  this.ball;
  this.mouseJoint;
  this.selected_tool=0;

  this.canvasPosition = this.getElementPosition(this.canvas);

  this.canvas.onselectstart = function() {
    return false;
  }

}//init

Tool.prototype.update = function() {
  
  if(this.bodies2delete.length > 0){
    for(var i=0; i<this.bodies2delete.length; i++){
      console.log('deleting: '+i);
      this.world.DestroyBody(this.bodies2delete[i]);
    }
    this.bodies2delete = [];
  }
  
  //console.log('update');
  /*
  if(!this.mouseJoint && this.selectedBody && !this.selectedBody.IsAwake())
    this.selectedBody = null
  */

  if(this.selectedBody && this.selected_tool != 2){
    this.center.x = this.selectedBody.GetPosition().x;
    this.center.y = this.selectedBody.GetPosition().y;
  }

  if(this.selected_tool == 0){
    if(this.isMouseDown && (!this.selectedBody)) {
      body = this.getBodyAtMouse();
      if(body) {
        this.selectedBody = body;
        this.selectedBody.SetAwake(true);
        this.isMouseDown = false;
        $('#unselect').fadeIn();
      }
    }
    else if(this.isMouseDown && (!this.mouseJoint) && (this.selectedBody)) {
      var md = new b2MouseJointDef();
      md.bodyA = this.world.GetGroundBody();
      md.bodyB = this.selectedBody;
      md.target.Set(this.selectedBody.GetPosition().x, this.selectedBody.GetPosition().y);
      md.collideConnected = false;
      this.mouseJoint = this.world.CreateJoint(md);
    }else if (this.mouseJoint) {
      if (this.isMouseDown) {
        this.mouseJoint.SetTarget(new b2Vec2(this.mouseX, this.mouseY));
      } else {
        this.selectedBody.SetAwake(true);
        this.selectedBody.ApplyForce(new b2Vec2((this.mouseJoint.GetAnchorA().x - this.selectedBody.GetPosition().x) * 1000, (this.mouseJoint.GetAnchorA().y - this.selectedBody.GetPosition().y) * 1000).GetNegative(), this.selectedBody.GetPosition());
        console.log('2) DestroyJoint');
        this.world.DestroyJoint(this.mouseJoint);
        this.mouseJoint = null;
        //this.selectedBody = null;
      }
    }
  }
  else if(this.selected_tool == 1){
    if(this.isMouseDown && (!this.mouseJoint)) {
      body = this.getBodyAtMouse();
      if(body) {
        //console.log('body')
        this.selectedBody = body;
        $('#inspector').fadeIn();
        //this.selectedBody.SetAwake(true);
      }
    }  
    if(this.selectedBody){
      $('#ins_name').val(this.selectedBody.id);
      $('#ins_type').val(this.selectedBody.m_type);
      $('#ins_x').val(this.selectedBody.GetPosition().x);
      $('#ins_y').val(this.selectedBody.GetPosition().y);
      $('#ins_mass').val(this.selectedBody.GetMass());
      $('#ins_angularVelocity').val(this.selectedBody.GetAngularVelocity())
      $('#ins_angularDamping').val(this.selectedBody.GetAngularDamping())
      $('#ins_linearDamping').val(this.selectedBody.GetLinearDamping())
      $('#ins_contactList').val(this.selectedBody.GetContactList())
      $('#ins_inertiaScale').val(this.selectedBody.m_inertiaScale)
      $('#ins_sleepTime').val(this.selectedBody.m_sleepTime)

      if(this.selectedBody.m_userData!=null){
        $('#ins_bodysize').val(this.selectedBody.m_userData.bodysize);
        $('#ins_imgsize').val(this.selectedBody.m_userData.imgsize);
        $('#ins_imgsrc').val(this.selectedBody.m_userData.imgsrc);
      }

      //$('#ins_fixtureList').val(this.selectedBody.GetFixtureList().GetShape().m_vertexCount)
      //$('#ins_userData').val(this.selectedBody.GetUserData())
      //this.selectedBody.SetAwake(true);
    }
  }else if(this.selected_tool == 2 && this.selectedBody && this.isMouseDown){
    this.selectedBody.SetPosition(new b2Vec2(this.mouseX, this.mouseY));
  }else if(this.selected_tool == 3){
    if(this.isMouseDown){
      if(this.building==null)
        this.building = {type:"rect", x1:this.mouseX, y1:this.mouseY, x2:this.mouseX, y2:this.mouseY, built: false};
      else{
        this.building.x2 = this.mouseX;
        this.building.y2 = this.mouseY;
      }
    }else if(this.building!=null && !this.building.built){
      var itens = 1;
      if(parseInt($('#bodies').val()) > 0)
        itens = parseInt($('#bodies').val());

      for(www=0;www<itens;www++){
        //create rect body
        var dx = this.building.x2 - this.building.x1;
        var dy = this.building.y1 - this.building.y1;
        var w = Math.sqrt(dx * dx + dy * dy);
        var dx = this.building.x1 - this.building.x1;
        var dy = this.building.y2 - this.building.y1;
        var h = Math.sqrt(dx * dx + dy * dy);
        //var h = w;
        //var dx = this.building.x1 - this.building.x1;
        //var dy = this.building.y1 - this.building.y1;
        //var h = Math.sqrt(dx * dx + dy * dy);
        
        //var w = Math.sqrt(Math.pow(this.building.x2-this.building.x1)+Math.pow(this.building.y1-this.building.y1))
        //var h = Math.sqrt(Math.pow(this.building.x1-this.building.x1)+Math.pow(this.building.y2-this.building.y1))
        var entity = {id: this.built.length+1, x: this.building.x1, y: this.building.y1, polys: [
          [{x: -w/2, y: -h/2}, {x: w/2, y: -h/2}, {x: w/2, y: h/2}, {x: -w/2, y: h/2}]
        ]};
        /*
        var entity = {id: this.built.length+1, x: this.building.x1, y: this.building.y1, polys: [
          [{x: this.building.x1, y: this.building.y1}, {x: this.building.x1, y: this.building.y2}, {x: this.building.x2, y:this.building.y2}, {x: this.building.x2, y:this.building.y1}]
        ]};
        */
        for (var j = 0; j < entity.polys.length; j++) {
          var points = entity.polys[j];
          var vecs = [];
          for (var i = 0; i < points.length; i++) {
            var vec = new b2Vec2();
            vec.Set(points[i].x, points[i].y);
            vecs[i] = vec;
          }
          this.bodyDef = new b2BodyDef;
          this.bodyDef.type = b2Body.b2_dynamicBody;
          if(this.building.x1<this.building.x2 && this.building.y1<this.building.y2)
            this.bodyDef.position.Set(this.building.x1+w/2, this.building.y1+h/2);
          else if(this.building.x1<this.building.x2 && this.building.y1>this.building.y2)
            this.bodyDef.position.Set(this.building.x1+w/2, this.building.y1-h/2);
          else if(this.building.x1>this.building.x2 && this.building.y1>this.building.y2)
            this.bodyDef.position.Set(this.building.x1-w/2, this.building.y1-h/2);
          else if(this.building.x1>this.building.x2 && this.building.y1<this.building.y2)
            this.bodyDef.position.Set(this.building.x1-w/2, this.building.y1+h/2);
          this.fixDef.shape = new b2PolygonShape;
          this.fixDef.shape.SetAsArray(vecs, vecs.length);
          
          var data = { 
            imgsrc: "/editor/img/09.png",
            imgsize: 277,
            bodysize: w + 0.1
          }
          this.bodyDef.userData = data;
          
          this.world.CreateBody(this.bodyDef).CreateFixture(this.fixDef);
        }
      }
      this.built.push(this.building);
      this.building = null;
    }
    else if(this.building){
      if(this.building.built)
        this.building = null;
    }

  }
  else if(this.selected_tool == 5){
    if(this.isMouseDown){
      if(this.building==null)
        this.building = {type:"circ", x:this.mouseX, y:this.mouseY, x2:this.mouseX, y2:this.mouseY, built: false};
      else{
        this.building.x2 = this.mouseX;
        this.building.y2 = this.mouseY;
      }
    }else if(this.building!=null && !this.building.built){
      var itens = 1;
      if(parseInt($('#bodies').val()) > 0)
        itens = parseInt($('#bodies').val());
      for(www=0;www<itens;www++){
        //create circular body
        this.bodyDef = new b2BodyDef;
        this.bodyDef.type = b2Body.b2_dynamicBody;
        this.bodyDef.position.Set(this.building.x, this.building.y);
        //radius
        var dx = this.building.x2 - this.building.x;
        var dy = this.building.y2 - this.building.y;
        var rad = Math.sqrt(dx * dx + dy * dy);
        this.fixDef.shape = new b2CircleShape(rad + 0.1);

        var data = { 
          imgsrc: "/editor/img/09.png",
          imgsize: 277,
          bodysize: rad + 0.1
        }
        this.bodyDef.userData = data;

        this.world.CreateBody(this.bodyDef).CreateFixture(this.fixDef);
        this.built.push(this.building);
        //this.building = null;
      }
      this.building = null;
    }
    else if(this.building){
      if(this.building.built)
        this.building = null;
    }

  }
  else if(this.selected_tool == 6){
    if(this.isMouseDown){
      if(this.building==null)
        this.building = {type:"regular-polygon", x:this.mouseX, y:this.mouseY, x2:this.mouseX, y2:this.mouseY, built: false};
      else{
        this.building.x2 = this.mouseX;
        this.building.y2 = this.mouseY;
      }
    }else if(this.building!=null && !this.building.built){
      
      var itens = 1;
      if(parseInt($('#bodies').val()) > 0)
        itens = parseInt($('#bodies').val());
      for(www=0;www<itens;www++){
        
        var numberOfSides = $('#vertices').val();
        var dx = this.building.x2 - this.building.x;
        var dy = this.building.y2 - this.building.y;
        var w = Math.sqrt(dx * dx + dy * dy);
        var a = (Math.sqrt(3)/6)/w;
        var h = w;
        var size = w;
        var Xcenter = (this.building.x);
        var Ycenter = (this.building.y);
  
        vecs = Array();
        var vec = new b2Vec2();
        vec.Set(Xcenter +  size * Math.cos(0), Ycenter +  size *  Math.sin(0));
        for (var i = 1; i <= numberOfSides;i += 1) {
          var vec = new b2Vec2();
          vec.Set(Xcenter + size * Math.cos(i * 2 * Math.PI / numberOfSides), Ycenter + size * Math.sin(i * 2 * Math.PI / numberOfSides));
          vecs.push(vec);
        }

        var data = { 
          imgsrc: "/editor/img/09.png",
          imgsize: 277,
          bodysize: w + 0.1
        }

        console.log(vecs);
        createSlice(vecs,vecs.length, data);
      }

      this.building = null;
    }
    else if(this.building){
      if(this.building.built)
        this.building = null;
    }

  }
  else if(this.selected_tool == 7){
    if(this.isMouseDown){
      if(this.building==null){
        this.building = {type:"iregular-polygon", points: new Array(), built: false};
        v = new b2Vec2();
        v.Set(this.mouseX,this.mouseY);
        this.building.points.push(v);
      }
      else{
        v = new b2Vec2();
        v.Set(this.mouseX,this.mouseY);
        this.building.points.push(v);
      }
    }else{
      if(this.building!=null){
        var numberOfSides = this.building.points.length;
        console.log(numberOfSides);
        vecs = Array();
        for (var i = 0; i < numberOfSides;i++) {
          var vec = new b2Vec2();
          vec.Set(this.building.points[i].x, this.building.points[i].y);
          vecs.push(vec);
        }

        createSlice(vecs,numberOfSides);
      }
      this.building = null;
    }
  }
  else if(this.selected_tool == 4){
    if(this.isMouseDown){
      if(this.building==null)
        this.building = {type:"line", x1:this.mouseX, y1:this.mouseY, x2:this.mouseX, y2:this.mouseY, built: false};
      else{
        this.building.x2 = this.mouseX;
        this.building.y2 = this.mouseY;
      }
      if(this.building.built){
        //this.building=null;
        //this.exitPoint=null;
        //this.entryPoint=null;
        //this.affectedBody = null;
      }
    }else{
      if(this.building){
        
        if(!this.building.built){
          //this.entryPoint=Array();
          //this.exitPoint=null;
          //this.affectedBody = null;

          //laserFired
          this.world.RayCast(laserFired, new b2Vec2(this.building.x1, this.building.y1), new b2Vec2(this.building.x2, this.building.y2));
          this.world.RayCast(laserFired, new b2Vec2(this.building.x2, this.building.y2), new b2Vec2(this.building.x1, this.building.y1));
          this.building.built = true;
        }else{
          this.building=null;
          //this.exitPoint=null;
          //this.entryPoint=Array();
          //this.affectedBody = null;
        }
      }else{
        this.building=null;
      }
    }
  }

  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  this.ctx.save();

  this.world.Step(1 / 60, 10, 10);

  //translate to center
  this.ctx.translate(parseInt(this.center.x * -this.debugDraw.GetDrawScale() + (this.canvas.width / 2)), parseInt(this.center.y * -this.debugDraw.GetDrawScale() + (this.canvas.height / 2)));
  
  if($('#render1').is(':checked') || $('#render3').is(':checked'))
    this.world.DrawDebugData();

  // Draw the x and y axes
  this.ctx.save();
  this.ctx.lineWidth = 0.1;
  var grid = 5;
  if(this.scale<1)
  	var grid = 100;
  if(this.scale<0.03)
  	var grid = 1500;
  if(this.scale<0.002)
  	var grid = 15000;
  if(this.scale<0.000007)
  	var grid = 150000;
  for(i=0; i<=this.canvas.height*grid*this.scale; i=i+grid*this.scale){
  	this.drawLine(this.ctx, -this.canvas.width, i, this.canvas.width+(this.canvas.width*this.scale), i);
  	if(i!=0)
  	  this.drawLine(this.ctx, -this.canvas.width, i*-1, this.canvas.width+(this.canvas.width*this.scale), i*-1);
  }

  for(i=0; i<=this.canvas.width*grid*this.scale; i=i+grid*this.scale){
  	this.drawLine(this.ctx, i, -this.canvas.height+(-this.canvas.height*this.scale), i, this.canvas.height+(this.canvas.height*this.scale));
  	if(i!=0)
  	  this.drawLine(this.ctx, i*-1, -this.canvas.height+(-this.canvas.height*this.scale), i*-1, this.canvas.height+(this.canvas.height*this.scale));
  }
  //this.drawLine(this.ctx, -this.canvas.width, 20*this.scale, this.canvas.width, 20*this.scale);
  
  //this.drawLine(this.ctx, -this.canvas.width, parseInt(21 * this.debugDraw.GetDrawScale()), this.canvas.width, parseInt(21 * this.debugDraw.GetDrawScale()));
  //this.drawLine(this.ctx, -this.canvas.width, parseInt(22 * this.debugDraw.GetDrawScale()), this.canvas.width, parseInt(22 * this.debugDraw.GetDrawScale()));
  //this.drawLine(this.ctx, -this.canvas.width, parseInt(23 * this.debugDraw.GetDrawScale()), this.canvas.width, parseInt(23 * this.debugDraw.GetDrawScale()));
  //this.drawLine(this.ctx, -this.canvas.width, parseInt(24 * this.debugDraw.GetDrawScale()), this.canvas.width, parseInt(24 * this.debugDraw.GetDrawScale()));
  //this.drawLine(this.ctx, -this.canvas.width, parseInt(10 * this.debugDraw.GetDrawScale()), this.canvas.width, parseInt(10 * this.debugDraw.GetDrawScale()));
  //this.drawLine(this.ctx, -this.canvas.width, parseInt(15 * this.debugDraw.GetDrawScale()), this.canvas.width, parseInt(15 * this.debugDraw.GetDrawScale()));
  // /this.drawLine(this.ctx, -this.canvas.width, parseInt(20 * this.debugDraw.GetDrawScale()), this.canvas.width, parseInt(20 * this.debugDraw.GetDrawScale()));
  
  this.ctx.restore();
  
  //this.drawLine(this.ctx, 0, -this.canvas.height, 0, this.canvas.height);
  //this.drawLine(this.ctx, 10, -this.canvas.height, 10, this.canvas.height);

  //this.ctx.lineWidth = 0.1 * this.debugDraw.GetDrawScale();
  //this.drawLine(this.ctx, -parseInt(this.canvas.width * this.debugDraw.GetDrawScale()), 0, parseInt(this.canvas.width * this.debugDraw.GetDrawScale()), 0);  
  //this.drawLine(this.ctx, 0, -parseInt(this.canvas.height * this.debugDraw.GetDrawScale()), 0, parseInt(this.canvas.height * this.debugDraw.GetDrawScale()));
  
  /*
  for(var i=0; i<100; i++){
    this.drawLine(this.ctx, -this.canvas.width, i*5, this.canvas.width, i*5);
    this.drawLine(this.ctx, i*5, -this.canvas.height, i*5, this.canvas.height);
  }
  */

  //draw
  if($('#render2').is(':checked') || $('#render3').is(':checked')){
    for( b = this.world.GetBodyList(); b; b = b.GetNext()) {
      if(b.GetType() == b2Body.b2_dynamicBody) {
        
        var s = b.GetFixtureList().GetShape();
        var pos = b.GetPosition();
        if(s.m_type == 0){
          //console.log('circ')
          this.ctx.save();
          this.ctx.beginPath();
          this.ctx.arc(b.GetPosition().x*this.scale, b.GetPosition().y*this.scale, s.m_radius*this.scale, 0 , 2 * Math.PI, false);
          this.ctx.closePath();
          
          if((b.m_userData != null)&&(b.m_userData.imgsrc && b.m_userData.imgsize)){
            var size = b.m_userData.imgsize;
            var imgObj = new Image(size,size);
            imgObj.src = b.m_userData.imgsrc;
            // create pattern
            var ptrn = this.ctx.createPattern(imgObj,'no-repeat');
            this.ctx.fillStyle = ptrn;
            
            this.ctx.translate((pos.x)*this.scale,(pos.y)*this.scale);
            //this.ctx.translate((pos.x-s.m_radius)*this.scale,(pos.y-s.m_radius)*this.scale);
          }else{
            this.ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
            this.ctx.translate(pos.x*this.scale,pos.y*this.scale);
          }

          // Translate to the center of the object, then flip and scale appropriately
          this.ctx.rotate(b.GetAngle());
          var s2 = -1*(size/2);
          var scale = b.m_userData.bodysize/-s2;
          this.ctx.translate(-s.m_radius*this.scale, -s.m_radius*this.scale);
          this.ctx.scale(scale*this.scale,scale*this.scale);

          this.ctx.fill();
          this.ctx.stroke();
          
          this.ctx.restore();
        }else if(s.m_type == 1){
          //console.log('square')
          this.ctx.save();
          this.ctx.translate(b.GetPosition().x*this.scale,b.GetPosition().y*this.scale);
          this.ctx.rotate(b.GetAngle());
          //this.ctx.translate(b.GetPosition().x*this.scale,b.GetPosition().y*this.scale);

          this.ctx.beginPath();
          this.ctx.moveTo(s.m_vertices[0].x*this.scale, s.m_vertices[0].y*this.scale);
          for(i=0;i<s.m_vertexCount;i++){
            if(i<s.m_vertexCount-1)
              this.ctx.lineTo(s.m_vertices[i].x*this.scale, s.m_vertices[i].y*this.scale, s.m_vertices[i+1].x*this.scale, s.m_vertices[i+1].y*this.scale);
            else
              this.ctx.lineTo(s.m_vertices[i].x*this.scale, s.m_vertices[i].y*this.scale, s.m_vertices[0].x*this.scale, s.m_vertices[0].y*this.scale);
          }
          this.ctx.closePath();
          
          if((b.m_userData != null)&&(b.m_userData.imgsrc && b.m_userData.imgsize)){
            var size = b.m_userData.imgsize;
            var imgObj = new Image(size,size);
            imgObj.src = b.m_userData.imgsrc;
            // create pattern
            var ptrn = this.ctx.createPattern(imgObj,'no-repeat');
            this.ctx.fillStyle = ptrn;
            
            //this.ctx.translate((pos.x)*this.scale,(pos.y)*this.scale);
          }else{
            this.ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
            //this.ctx.translate(pos.x*this.scale,pos.y*this.scale);
          }

          // Translate to the center of the object, then flip and scale appropriately
          if(b.m_userData){
            var s2 = -1*(size/2);
            var scale = b.m_userData.bodysize/-s2;
          }else{
            var s2 = 1;
            var scale = 1;
          }
          if((b.m_userData != null)&&(b.m_userData.imgsrc && b.m_userData.imgsize))
            this.ctx.translate(-b.m_userData.bodysize*this.scale, -b.m_userData.bodysize*this.scale);
          this.ctx.scale(scale*this.scale,scale*this.scale);

          this.ctx.fill();
          this.ctx.rotate(b.GetAngle());
          this.ctx.restore();
        }
        
        /*
        //b.SetAwake(true);
        var pos = b.GetPosition();
        if((b.m_userData != null)&&(b.m_userData.imgsrc && b.m_userData.imgsize)){
          // Draw the image on the object
          var size = b.m_userData.imgsize;
          var imgObj = new Image(size,size);
          imgObj.src = b.m_userData.imgsrc;
          this.ctx.save();
          // Translate to the center of the object, then flip and scale appropriately
          this.ctx.translate(pos.x*this.scale,pos.y*this.scale);
          this.ctx.rotate(b.GetAngle());
          var s2 = -1*(size/2);
          var scale = b.m_userData.bodysize/-s2;
          this.ctx.scale(scale*this.scale,scale*this.scale);
          this.ctx.drawImage(imgObj,s2,s2);
          this.ctx.restore();
        }
        */  
      }
      else if(b.GetFixtureList()){
        var s = b.GetFixtureList().GetShape();
        if(s.m_type == 0){
          //console.log('circ')
          this.ctx.save();
          this.ctx.beginPath();
          this.ctx.arc(b.GetPosition().x*this.scale, b.GetPosition().y*this.scale, s.m_radius*this.scale, 0 , 2 * Math.PI, false);
          this.ctx.closePath();
          this.ctx.fillStyle = "rgba(255, 255, 0, 0.5)";
          this.ctx.fill();
          this.ctx.restore();
        }else if(s.m_type == 1){
          this.ctx.save();
          this.ctx.translate(b.GetPosition().x*this.scale,b.GetPosition().y*this.scale);
          this.ctx.beginPath();
          this.ctx.moveTo(s.m_vertices[0].x*this.scale, s.m_vertices[0].y*this.scale);
          for(i=0;i<s.m_vertexCount;i++){
            if(i<s.m_vertexCount-1)
              this.ctx.lineTo(s.m_vertices[i].x*this.scale, s.m_vertices[i].y*this.scale, s.m_vertices[i+1].x*this.scale, s.m_vertices[i+1].y*this.scale);
            else
              this.ctx.lineTo(s.m_vertices[i].x*this.scale, s.m_vertices[i].y*this.scale, s.m_vertices[0].x*this.scale, s.m_vertices[0].y*this.scale);
          }
          this.ctx.closePath();
          this.ctx.fillStyle = "rgba(255, 0, 255, 0.5)";
          this.ctx.fill();
          this.ctx.restore();
        }
      }
    }
  }
  if(this.mouseJoint){
    this.drawLine(this.ctx, this.mouseJoint.GetAnchorA().x*this.scale, this.mouseJoint.GetAnchorA().y*this.scale, this.mouseJoint.GetAnchorB().x*this.scale, this.mouseJoint.GetAnchorB().y*this.scale);
  }
  if(this.selectedBody){
    var s = this.selectedBody.GetFixtureList().GetShape();
    if(s.m_type == 0){
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(this.selectedBody.GetPosition().x*this.scale, this.selectedBody.GetPosition().y*this.scale, s.m_radius*this.scale, 0 , 2 * Math.PI, false);
      this.ctx.closePath();
      this.ctx.fillStyle = "rgba(255, 255, 0, 0.5)";
      this.ctx.fill();
      this.ctx.restore();
    }else if(s.m_type == 1){
      this.ctx.save();
      this.ctx.translate(this.selectedBody.GetPosition().x*this.scale,this.selectedBody.GetPosition().y*this.scale);
      this.ctx.rotate(this.selectedBody.GetAngle());
      this.ctx.beginPath();
      this.ctx.moveTo(s.m_vertices[0].x*this.scale, s.m_vertices[0].y*this.scale);
      for(i=0;i<s.m_vertexCount;i++){
        if(i<s.m_vertexCount-1)
          this.ctx.lineTo(s.m_vertices[i].x*this.scale, s.m_vertices[i].y*this.scale, s.m_vertices[i+1].x*this.scale, s.m_vertices[i+1].y*this.scale);
        else
          this.ctx.lineTo(s.m_vertices[i].x*this.scale, s.m_vertices[i].y*this.scale, s.m_vertices[0].x*this.scale, s.m_vertices[0].y*this.scale);
      }
      this.ctx.closePath();
      this.ctx.fillStyle = "rgba(255, 255, 0, 0.5)";
      this.ctx.fill();
      this.ctx.restore();
    }
  }
  //building shapes
  if(this.building != null){
    if(this.building.type == "rect"){
      console.log("drawing rect")
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.moveTo(this.building.x1*this.scale, this.building.y1*this.scale);
      this.ctx.lineTo(this.building.x1*this.scale, this.building.y2*this.scale);
      this.ctx.lineTo(this.building.x2*this.scale, this.building.y2*this.scale);
      this.ctx.lineTo(this.building.x2*this.scale, this.building.y1*this.scale);
      this.ctx.lineTo(this.building.x1*this.scale, this.building.y1*this.scale);

      this.ctx.moveTo(this.building.x1*this.scale, this.building.y1*this.scale);
      this.ctx.lineTo(this.building.x2*this.scale, this.building.y2*this.scale);

      this.ctx.closePath();
      this.ctx.strokeStyle = "rgba(255, 255, 0, 1)";
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
      this.ctx.restore();
    }
    else if(this.building.type == "circ"){
      console.log("drawing circ")
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.moveTo(this.building.x*this.scale, this.building.y*this.scale);
      this.ctx.lineTo(this.building.x2*this.scale, this.building.y2*this.scale);

      var dx = this.building.x2 - this.building.x;
      var dy = this.building.y2 - this.building.y;
      var w = Math.sqrt(dx * dx + dy * dy);

      this.ctx.moveTo(this.building.x*this.scale, this.building.y*this.scale);
      this.ctx.arc(this.building.x*this.scale, this.building.y*this.scale, w*this.scale, 0, 2*Math.PI);

      this.ctx.closePath();
      this.ctx.strokeStyle = "rgba(255, 255, 0, 1)";
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
      this.ctx.restore();
    }
    else if(this.building.type == "regular-polygon"){
      console.log("drawing regular-polygon")

      var numberOfSides = $('#vertices').val();
      var dx = this.building.x2 - this.building.x;
      var dy = this.building.y2 - this.building.y;
      var w = Math.sqrt(dx * dx + dy * dy);
      var a = (Math.sqrt(3)/6)/w;
      var h = w;

      var size = w;
      var Xcenter = this.building.x*this.scale;
      var Ycenter = this.building.y*this.scale;

      this.ctx.save();
      this.ctx.beginPath();

      this.ctx.moveTo(Xcenter +  size * Math.cos(0)*this.scale, Ycenter +  size *  Math.sin(0)*this.scale);

      for (var i = 1; i <= numberOfSides;i += 1) {
        this.ctx.lineTo(
          Xcenter + size * Math.cos(i * 2 * Math.PI / numberOfSides)*this.scale,
          Ycenter + size * Math.sin(i * 2 * Math.PI / numberOfSides)*this.scale
        );
      }
      // //      
      var dx = this.building.x2 - this.building.x;
      var dy = this.building.y2 - this.building.y;
      var w = Math.sqrt(dx * dx + dy * dy);

      this.ctx.moveTo(this.building.x*this.scale, this.building.y*this.scale);
      this.ctx.arc(this.building.x*this.scale, this.building.y*this.scale, w*this.scale, 0, 2*Math.PI);

      this.ctx.closePath();
      this.ctx.strokeStyle = "rgba(255, 255, 0, 1)";
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
      this.ctx.restore();
    }
    else if(this.building.type == "iregular-polygon"){
      console.log("drawing iregular-polygon")
      var numberOfSides = this.building.points.length;
      
      console.log(numberOfSides);
      //this.building = null;
      
      this.ctx.save();
      this.ctx.beginPath();
      for (var i = 0; i < numberOfSides; i++) {
        this.ctx.lineTo(
          this.building.points[i].x*this.scale,
          this.building.points[i].y*this.scale
        );
      }
      this.ctx.closePath();
      this.ctx.strokeStyle = "rgba(255, 255, 0, 1)";
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
      this.ctx.restore();
    }
    else if(this.building.type == "line"){
      //console.log("drawing line")
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.moveTo(this.building.x1*this.scale, this.building.y1*this.scale);
      this.ctx.lineTo(this.building.x2*this.scale, this.building.y2*this.scale);
      this.ctx.closePath();
      this.ctx.strokeStyle = "rgba(255, 255, 0, 1)";
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
      this.ctx.restore();
    }
    
  }
  //drawend

  // Draw debug
  this.ctx.save();
  this.ctx.scale(1,1);
  //reset
  this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  this.ctx.textAlign = 'right';
  this.ctx.fillStyle = 'yellow';
  this.ctx.fillText('scale = ' + this.scale, this.canvas.width-15, 60);
  this.ctx.fillText('selected_tool = ' + this.selected_tool, this.canvas.width-15, 70);
  if(this.selectedBody)
    this.ctx.fillText('selected_body = ' + this.selectedBody.GetPosition().x, this.canvas.width-15, 80);
  if(this.affectedBody){
    this.ctx.fillText('affectedBodies = ' + this.affectedBody.length, this.canvas.width-15, 90);
    if(this.affectedBody[0] != null){
      if(this.affectedBody[0].part1Vertices != null){
        this.ctx.fillText('affectedBody[0] parts1 = ' + this.affectedBody[0].part1Vertices.length, this.canvas.width-15, 100);
      }
      if(this.affectedBody[0].part2Vertices != null){
        this.ctx.fillText('affectedBody[0] parts2 = ' + this.affectedBody[0].part2Vertices.length, this.canvas.width-15, 110);
      }
    }
  }
  this.ctx.restore();
  
  this.ctx.restore();

  this.world.ClearForces();
  
  //requestAnimFrame(this.update());

}//update

Tool.prototype.drawLine = function(contextO, startx, starty, endx, endy) {
  contextO.strokeStyle = 'cyan';
  contextO.beginPath();
  contextO.moveTo(startx, starty);
  contextO.lineTo(endx, endy);
  contextO.closePath();
  contextO.stroke();
}

Tool.prototype.handleMouseMove = function(e) {
  this.mouseX = (e.clientX) / this.debugDraw.GetDrawScale() + this.center.x - (this.canvas.width / 2) / this.debugDraw.GetDrawScale();
  this.mouseY = (e.clientY) / this.debugDraw.GetDrawScale() + this.center.y - (this.canvas.height / 2) / this.debugDraw.GetDrawScale();
  //console.log(e.clientX+' '+this.debugDraw.GetDrawScale()+' '+this.mouseX + ', ' + this.mouseY);
};

Tool.prototype.getBodyAtMouse = function() {
  mousePVec = new b2Vec2(this.mouseX, this.mouseY);
  var aabb = new b2AABB();
  aabb.lowerBound.Set(this.mouseX - 0.001, this.mouseY - 0.001);
  aabb.upperBound.Set(this.mouseX + 0.001, this.mouseY + 0.001);

  // Query the world for overlapping shapes.
  body = null;
  this.world.QueryAABB(this.getBodyCB, aabb);
  return body;
}

Tool.prototype.getBodyCB = function(fixture) {
  //if (fixture.GetBody().GetType() != b2Body.b2_staticBody) {
    if (fixture.GetShape().TestPoint(fixture.GetBody().GetTransform(), mousePVec)) {
      console.log('body')
      body = fixture.GetBody();
      return false;
    }else
      console.log('!body')
  //}
  console.log('nada')
  return true;
}

//http://js-tut.aardon.de/js-tut/tutorial/position.html
Tool.prototype.getElementPosition = function(element) {
  var elem = element, tagname = "", x = 0, y = 0;
  while (( typeof (elem) == "object") && ( typeof (elem.tagName) != "undefined")) {
    y += elem.offsetTop;
    x += elem.offsetLeft;
    tagname = elem.tagName.toUpperCase();
    if (tagname == "BODY")
      elem = 0;
    if ( typeof (elem) == "object") {
      if ( typeof (elem.offsetParent) == "object")
        elem = elem.offsetParent;
    }
  }
  return {
    x : x,
    y : y
  };
}

Tool.prototype.doMouseWheel = function(a) {

  var e = window.event || a; // old IE support
  e.preventDefault();
  var d = e.wheelDelta || e.detail*(-120);

  //var evt=window.event || e //equalize event object
  //var delta=evt.detail? evt.detail*(-120) : evt.wheelDelta //check for detail first so Opera uses that instead of wheelDelta

  //var d = a.wheelDelta;
  //console.log(d);
  if (d < 0)
    this.scale = this.debugDraw.GetDrawScale() * 1.1;
  else
    this.scale = this.debugDraw.GetDrawScale() * 1 / 1.1;
  this.debugDraw.SetDrawScale(this.scale);
}

Tool.prototype.doKeyDown = function(evt) {
  switch (evt.keyCode) {
    case 38:
      /* Up arrow was pressed */
      console.log('up');
      var vel = selectedBody.GetLinearVelocity();
      vel.y -= 15;
      selectedBody.SetLinearVelocity(vel);
      break;
    case 40:
      /* Down arrow was pressed */
      console.log('down');
      var vel = selectedBody.GetLinearVelocity();
      vel.y += 15;
      selectedBody.SetLinearVelocity(vel);
      break;
    case 37:
      /* Left arrow was pressed */
      console.log('left');
      var vel = selectedBody.GetLinearVelocity();
      vel.x -= 15;
      selectedBody.SetLinearVelocity(vel);
      break;
    case 39:
      /* Right arrow was pressed */
      console.log('right');
      var vel = selectedBody.GetLinearVelocity();
      vel.x += 15;
      selectedBody.SetLinearVelocity(vel);
      break;
  }
}

Tool.prototype.selectBody = function() {
  this.selected_tool = 1;
  $('#selected_tool').html('Body Select');
  $('#inspector').fadeIn();
  $('#unselect').fadeOut();
  $('#world-settings').fadeOut();
  $('#world-load').fadeOut();
  $('#world-save').fadeOut();
}

Tool.prototype.selectBody = function() {
  this.selected_tool = 1;
  $('#selected_tool').html('Body Select');
  $('#inspector').fadeIn();
  $('#unselect').fadeOut();
  $('#world-settings').fadeOut();
  $('#world-load').fadeOut();
  $('#world-save').fadeOut();
}

Tool.prototype.navigate = function() {
  this.selected_tool = 0;
  $('#selected_tool').html('Apply Force');
  $('#inspector').fadeOut();
  $('#unselect').fadeIn();
}

Tool.prototype.unselect = function() {
  this.selectedBody = null;
  $('#unselect').fadeOut();
  $('#inspector').fadeOut();
  $('#world-settings').fadeOut();
  $('#world-load').fadeOut();
  $('#world-save').fadeOut();
  $('#vertices-input').fadeOut();
  $('#create-btn').fadeOut();
  $('#stop-btn').fadeOut();
  $('#number-input').fadeOut();
}

Tool.prototype.worldSettings = function() {
  this.unselect();
  $('#world-settings').fadeIn();
}

Tool.prototype.worldAwakeAll = function() {
  //this.unselect();
  //$('#world-settings').fadeIn();
  for( b = this.world.GetBodyList(); b; b = b.GetNext()) {
    if(b.GetType() == b2Body.b2_dynamicBody)
      b.SetAwake(true);
  }
}

Tool.prototype.worldSaveSettings = function() {
  this.unselect();
  this.world.SetGravity(new b2Vec2(parseFloat($('#set_gravity_x').val()), parseFloat($('#set_gravity_y').val())));
  for( b = this.world.GetBodyList(); b; b = b.GetNext()) {
    if(b.GetType() == b2Body.b2_dynamicBody)
      b.SetAwake(true);
  }
  $('#world-settings').fadeOut();
}


Tool.prototype.worldLoad = function() {
  this.unselect();
  $('#world-load').fadeIn();
}

Tool.prototype.worldLoadFromDisk = function() {
  this.initialState = JSON.parse(localStorage[$("#saved-worlds option:selected").val()]);
  console.log(this.initialState);
  this.init();
}

Tool.prototype.worldSave = function() {
  this.unselect();
  $('#world-save').fadeIn();
}

Tool.prototype.worldSaveToDisk = function() {
  var select = document.getElementById("saved-worlds");
  var key = $('#world-name').val();
  
  var bodies = [];
  var fixtures = [];
  for( b = this.world.GetBodyList(); b; b = b.GetNext()) {
    var pos = b.GetPosition();
    var f = b.GetFixtureList();
    if(f!=null){
      console.log(f);
      var shape = f.GetShape();
      var fixture = {
        "density": f.GetDensity(),
        "friction": f.GetFriction(),
        "restitution": f.GetRestitution(),
        "shape": {
          type: shape.GetType(),
        }
      };
      if(shape.GetType() == 0){
        fixture.circle = {
          center: {
            x: b.GetPosition().x,
            y: b.GetPosition().y
          },
          radius: shape.GetRadius()
        };
      }else if(shape.GetType() == 1){
        var vertices = [];
        var v = shape.GetVertices();
        for (var j = 0; j < v.length; j++) {
          vertices.push({
            x: v[j].x,
            y: v[j].y,
          });
        }
        fixture.polygon = {
          vertices: vertices
        }
      }
      
      var body = {
        "type": b.GetType(),
        "m_type": b.m_type,
        "angle": b.m_angle,
        "angularVelocity": b.m_angularVelocity,
        "angularDamping": b.m_angularDamping,
        "linearDamping": b.m_linearDamping,
        "linearVelocity": b.m_linearVelocity,
        "torque": b.m_torque,
        "angularDamping": b.m_angularDamping,
        "userData": b.m_userData,
        "fixtureCount": b.m_fixtureCount,
        "force": b.m_force,
        "mass": b.m_mass,
        "inertiaScale": b.m_inertiaScale,
        "position":{
          x: b.GetPosition().x,
          y: b.GetPosition().y
        },
        "fixture": [fixture]
      }
      //console.log(b);
      bodies.push(body);
    }
  }
  
  console.log("bodies: "+bodies.length);
  
  var world = {
    "gravity": {
      "x": this.world.m_gravity.x,
      "y": this.world.m_gravity.y }, 
    "allowSleep": this.world.m_allowSleep, 
    "body": bodies
  };
  
  console.log(world);

  localStorage[key] = JSON.stringify(world);
  select.appendChild(new Option(key));
  console.log("saved as "+key);
}

Tool.prototype.bodyDuplicate = function() {
  if(this.selectedBody){
    var shape = this.selectedBody.GetFixtureList().GetShape();
    var pos = this.selectedBody.GetPosition();
    console.log(shape.m_type)
    if(shape.m_type == 0){
      this.bodyDef.type = b2Body.b2_dynamicBody;
      var rad = shape.m_radius;
      //var data = this.selectedBody.GetUserData();
      //radius
      this.fixDef.shape = new b2CircleShape(rad);
      this.bodyDef.position.x = pos.x;
      this.bodyDef.position.y = pos.y;
      this.bodyDef.userData = this.selectedBody.GetUserData();
      var b = this.world.CreateBody(this.bodyDef);
      b.CreateFixture(this.fixDef);
    }else if(shape.m_type == 1){
      var shape = this.selectedBody.GetFixtureList().GetShape();

      //var data = this.selectedBody.GetUserData();
      this.bodyDef.type = b2Body.b2_dynamicBody;
      this.bodyDef.userData = this.selectedBody.GetUserData();

      this.fixDef.shape = new b2PolygonShape;
      this.fixDef.shape = shape;
      this.world.CreateBody(this.bodyDef).CreateFixture(this.fixDef);

      //radius
      //this.bodyDef.position.x = pos.x;
      //this.bodyDef.position.y = pos.y;
      //var b = this.world.CreateBody(this.bodyDef);
      //b.CreateFixture(this.fixDef);
    }
  }
}

Tool.prototype.bodyMove = function() {
  //this.unselect();
  if(this.selectedBody){
    $('#inspector').fadeOut();
    this.selected_tool = 2;
    $('#selected_tool').html('Move Body');
  }
}

Tool.prototype.bodyDelete = function() {
  if(this.selectedBody){
    this.bodies2delete.push(this.selectedBody);
    this.unselect();
  }
}

Tool.prototype.createRect = function() {
  this.unselect();
  if(this.selectedBody)
    this.unselect();
  this.selected_tool = 3;
  $('#selected_tool').html('Create Rectangular Body');
  $('#number-input').fadeIn();
}

Tool.prototype.createCirc = function() {
  this.unselect();
  if(this.selectedBody)
    this.unselect();
  this.selected_tool = 5;
  $('#selected_tool').html('Create Circular Body');
  $('#stop-btn').fadeIn();
  $('#number-input').fadeIn();
}

Tool.prototype.createPolygon = function() {
  this.unselect();
  if(this.selectedBody)
    this.unselect();
  this.selected_tool = 6;
  $('#selected_tool').html('Create Regular Polygon Body');
  $('#vertices-input').fadeIn();
  $('#number-input').fadeIn();
}

Tool.prototype.createShape = function() {
  this.unselect();
  if(this.selectedBody)
    this.unselect();
  this.selected_tool = 7;
  $('#selected_tool').html('Create Regular Shape Body');
  $('#create-btn').fadeIn();
  $('#number-input').fadeIn();
}

Tool.prototype.createIrregularShape = function() {
  console.log('asdf');
  this.building.built = true;
  $('#number-input').fadeIn();
}

Tool.prototype.creationStop = function() {
  console.log('stop');
  this.building = null;
  $('#stop-btn').fadeOut();
}


Tool.prototype.sliceBody = function() {
  this.unselect();
  this.building = null;
  this.exitPoint = null;
  this.affectedBody = null;
  this.affectedByLaser = Array();
  this.entryPoint = Array();
  this.selected_tool = 4;
  $('#selected_tool').html('Trace a line to cut the intersecting bodies');
}

Tool.prototype.loadSavedWorlds = function() {
  var select = document.getElementById("saved-worlds");
  select.innerHTML = '';
  for(var k in localStorage) {
    select.appendChild(new Option(k));
  }
}

function slice1(fixture, point, normal, fraction) {
  //console.log('slice1');
  body = fixture.GetBody();
  body.polygon = fixture.GetShape();
  if(window.tool.affectedBody){
    fixtureIndex = window.tool.affectedBody.indexOf(body);
    if(fixtureIndex==-1)
      window.tool.affectedBody.push(body);
    if(window.tool.entryPoint)
      window.tool.entryPoint.push(point);
    else{
      window.tool.entryPoint = new Array();
      window.tool.entryPoint.push(point);
    }
  }
  else{
    window.tool.affectedBody = new Array();
    window.tool.affectedBody.push(body);
    if(window.tool.entryPoint)
      window.tool.entryPoint.push(point);
    else{
      window.tool.entryPoint = new Array();
      window.tool.entryPoint.push(point);
    }
  }
  return 1;
}

function laserFired(fixture,point,normal,fraction) {
  var affectedBody=fixture.GetBody();
  affectedBody.polygon = fixture.GetShape();
  console.log(window.tool.affectedByLaser);
  var fixtureIndex = -1;
  if(window.tool.affectedByLaser){
    fixtureIndex=window.tool.affectedByLaser.indexOf(affectedBody);
  }
  if(fixtureIndex==-1) {
    window.tool.affectedByLaser.push(affectedBody);
    window.tool.entryPoint.push(point);
  }
  else{
    if(affectedBody.polygon.m_type == 0){
      console.log('circle');
    }
    else if(window.tool.entryPoint[fixtureIndex] != null) {
      //console.log(window.tool.entryPoint[fixtureIndex]);
      //return 0;
      var rayCenter=new b2Vec2((point.x+window.tool.entryPoint[fixtureIndex].x)/2,(point.y+window.tool.entryPoint[fixtureIndex].y)/2);
      var rayAngle=Math.atan2(window.tool.entryPoint[fixtureIndex].y-point.y,window.tool.entryPoint[fixtureIndex].x-point.x);
      
      //console.log(affectedBody.polygon);
      var polyVertices=affectedBody.polygon.GetVertices();
  
      var newPolyVertices1=new Array();
      var newPolyVertices2=new Array();
      var currentPoly=0;
      var cutPlaced1=false;
      var cutPlaced2=false;
      for (var i=0; i<polyVertices.length; i++) {
        var worldPoint=affectedBody.GetWorldPoint(polyVertices[i]);
        var cutAngle=Math.atan2(worldPoint.y-rayCenter.y,worldPoint.x-rayCenter.x)-rayAngle;
        if (cutAngle<Math.PI*-1) {
          cutAngle+=2*Math.PI;
        }
        if (cutAngle>0&&cutAngle<=Math.PI) {
          if (currentPoly==2) {
            cutPlaced1=true;
            newPolyVertices1.push(point);
            newPolyVertices1.push(window.tool.entryPoint[fixtureIndex]);
          }
          newPolyVertices1.push(worldPoint);
          currentPoly=1;
        } else {
          if (currentPoly==1) {
            cutPlaced2=true;
            newPolyVertices2.push(window.tool.entryPoint[fixtureIndex]);
            newPolyVertices2.push(point);
          }
          newPolyVertices2.push(worldPoint);
          currentPoly=2;
        }
      }
      if (! cutPlaced1) {
        newPolyVertices1.push(point);
        newPolyVertices1.push(window.tool.entryPoint[fixtureIndex]);
      }
      if (! cutPlaced2) {
        newPolyVertices2.push(window.tool.entryPoint[fixtureIndex]);
        newPolyVertices2.push(point);
      }
      createSlice(newPolyVertices1,newPolyVertices1.length);
      createSlice(newPolyVertices2,newPolyVertices2.length);
      window.tool.world.DestroyBody(affectedBody);
    }
  }  
  
  return 1;
}

function createSlice(vertices,numVertices, data) {
  var centre=findCentroid(vertices,vertices.length);
  for (var i=0; i<numVertices; i++) {
    vertices[i].Subtract(centre);
  }
  var sliceBody= new b2BodyDef();
  
  sliceBody.position.Set(centre.x, centre.y);
  sliceBody.type=b2Body.b2_dynamicBody;
  var slicePoly = new b2PolygonShape();
  slicePoly.SetAsVector(vertices,numVertices);
  var sliceFixture = new b2FixtureDef();
  sliceFixture.shape=slicePoly;
  sliceFixture.density=1;

  if(data!=null)
    sliceBody.userData = data;

  var worldSlice=window.tool.world.CreateBody(sliceBody);
  worldSlice.CreateFixture(sliceFixture);
  for (i=0; i<numVertices; i++) {
    vertices[i].Add(centre);
  }
}

function findCentroid(vs, count) {
  var c = new b2Vec2();
  var area=0.0;
  var p1X=0.0;
  var p1Y=0.0;
  var inv3=1.0/3.0;
  for (var i = 0; i < count; ++i) {
    var p2=vs[i];
    var p3=i+1<count?vs[parseInt(i+1)]:vs[0];
    var e1X=p2.x-p1X;
    var e1Y=p2.y-p1Y;
    var e2X=p3.x-p1X;
    var e2Y=p3.y-p1Y;
    var D = (e1X * e2Y - e1Y * e2X);
    var triangleArea=0.5*D;
    area+=triangleArea;
    c.x += triangleArea * inv3 * (p1X + p2.x + p3.x);
    c.y += triangleArea * inv3 * (p1Y + p2.y + p3.y);
  }
  c.x*=1.0/area;
  c.y*=1.0/area;
  c.x = c.x//*window.tool.scale;
  c.y = c.y//*window.tool.scale;
  return c;
}


//init
window.tool = new Tool();

// Listeners
//Change to animationframe
window.setInterval(function(){window.tool.update()}, 1000 / 60);
window.addEventListener("mousewheel", function(b) {
  window.tool.doMouseWheel(b)
}, false);
window.addEventListener("DOMMouseScroll", function(b) {
  window.tool.doMouseWheel(b)
}, false);

document.addEventListener('mousemove', function(e){ tool.handleMouseMove(e) }, false);

document.getElementById("canvas").addEventListener("mousedown", function(e) {
  tool.isMouseDown = true;
}, true);

document.addEventListener("mouseup", function() {
  tool.isMouseDown = false;
}, true);

window.addEventListener('keydown', function(e){ tool.doKeyDown(e)}, true);