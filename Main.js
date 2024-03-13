// vars
var PLAYER_MOVE_INTERVAL = setInterval(function(){ Player1.UpdatePosition() }, 17 );
var TIME_INTERVAL = setInterval(function(){ GameTime.UpdateTime() }, 500);

var curTime = 60;

// func
function returnListFromObj(obj){ return Object.keys(obj); }

function checkInRange(t, min, max) { return t >= min && t <= max }

function findItemInArr(arr,search){

    for (var i = 0 ; i < arr.length ; i++) {
        if (arr[i] == search) {
            return true;
        }
    }

    return false;

}

function getAllFalse(obj){
    var leng = returnListFromObj(obj).length;

    for (var i = 0 ; i < leng ; i ++) {

        if (obj[returnListFromObj(obj)[i]] == true) { return false }

    }

    return true;
}

// modules/classes

function Time(){

    // constructors

    this.hour = 0;
    this.minute = 0;
    this.currentFrame = "AM"

    // init method

    Time.prototype.Init = function(){

        this.SetTime();
        this.UpdateUI();

    };

    // get methods

    Time.prototype.GetTime = function(_t) {

        this.SetTime();

        if (_t == "H" || _t == "h") { return this.hour }
        if (_t == "M" || _t == "m") { return this.minute }
        if (_t == "B" || _t == "b") { return this.hour + ":" + this.minute }

    };
    
    // set methods

    Time.prototype.SetTime = function(){

        this.hour = Math.floor(curTime / 60);
        this.minute = curTime % 60;
        
        if (this.minute < 10) { this.minute = "0" + this.minute }

        if (this.hour > 12) { this.hour = 1; if (this.currentFrame == "AM") { this.currentFrame = "PM" } else { this.currentFrame = "AM" } }

        this.hour = String(this.hour);
        this.minute = String(this.minute);

    };

    // update methods

    Time.prototype.UpdateTime = function(){ curTime ++ ; this.SetTime() ; this.UpdateUI(); };

    Time.prototype.UpdateUI = function(){

        setProperty("TIME_HOUR","text", this.hour);
        setProperty("TIME_MIN","text", this.minute);

    };

}

function Plant(id, type, position, timePlanted){

    // constructors
    this.type = type;
    this.position = position;
    this.timePlanted = timePlanted;

    this.sprite = String(type + "_" + "1.png");
    this.stage = 1;
    this.fullygrown = false;
    this.id = id;

    // init method

    Plant.prototype.Init = function(){

        var sp = this.sprite;
        var st = this.stage;
        var _id = this.id;
        var pos = this.position;
        var ty = this.type;
        var fg = this.fullygrown;
        var ufg = this.UpdateFullyGrown;

        var sOffsets = {
            "tomato": {X: 2, Y: 12, X2: 0, Y2: 2, TBS: 3, WORTH: Player1.inventory.Worths.Tomato, COST: Player1.inventory.Prices.Tomato},
            "carrot": {X: 0, Y: 10, X2: 1, Y2: 4, TBS: 5, WORTH: Player1.inventory.Worths.Carrot, COST: Player1.inventory.Prices.Carrot},
            "strawberry": {X: 2, Y: 12, X2: 4, Y2: 0, TBS: 8, WORTH: Player1.inventory.Worths.Strawberry, COST: Player1.inventory.Prices.Strawberry},
            "pumpkin": {X: 0, Y: 10, X2: 1, Y2: 7, TBS: 15, WORTH: Player1.inventory.Worths.Pumpkin, COST: Player1.inventory.Prices.Pumpkin}
        };

        var p = image(_id, sp);
        Player1.UpdateGold(sOffsets[ty].COST * -1)

        //setPosition(_id, pos.X + sOffsets[ty].X, pos.Y + sOffsets[ty].Y);
        //Tween.easeScale(_id, {W: 0, H: 0}, {W: 32, H: 32}, 50, "easeOut");

        setPosition(_id, 500,500);
        Tween.easePosition(_id, {X: pos.X + sOffsets[ty].X, Y: -50}, {X: pos.X + sOffsets[ty].X, Y: pos.Y + sOffsets[ty].Y}, 200, "bounceOut");

        var interval = setInterval(function(){
            
            if (st == 6) { fg = true; clearInterval(interval); ufg(_id, sOffsets[ty].WORTH); return; }

            if (st == 1) { setPosition(_id, pos.X + sOffsets[ty].X2, pos.Y + sOffsets[ty].Y2) }

            st ++;

            sp = String(ty + "_" + st + ".png");
            setImageURL(_id, sp);

        }, sOffsets[ty].TBS * 1000);

        this.sprite = sp;
        this.stage = st;
        this.id = _id;
        this.position = pos;
        this.type = ty;
        this.fullygrown = fg;

    };

    // update methods

    Plant.prototype.UpdateFullyGrown = function(_id, worth){

        Tween.easePosition(_id, {X: getXPosition(_id), Y: getYPosition(_id)}, {X: getXPosition(_id), Y: getYPosition(_id) - 25}, 75, "easeOut") ;

        var t1 = setTimeout(function(){ 

            Tween.easePosition(_id, {X: getXPosition(_id), Y: getYPosition(_id)}, {X: getXPosition(_id), Y: getYPosition(_id) + 25}, 200, "bounceOut") ;
            clearTimeout(t1);

            var t2 = setTimeout(function(){ 

                Tween.easeScale(_id, {W: 32, H: 32}, {W: 0, H: 0}, 100, "easeInCubic");
                Player1.UpdateGold(worth);

                clearTimeout(t2);

                var t3 = setTimeout(function(){

                    deleteElement(_id);
                    removeItem( Player1.interactablesOcc , Player1.interactablesOcc.indexOf(_id) );
                    clearTimeout(t3);
        
                },1000);

             },750);

         },295);

    };

}

function Player(id, initState, initDirection, initX, initY){

    // constructors

    this.id = id;
    this.state = initState || "idle";
    this.direction = initDirection || "d";

    this.animation = undefined;

    this.holding = undefined;
    this.inRangeInteract = undefined;
    this.interactrange = 11;

    this.moveinterval = undefined;
    this.movespeed = 1;
    this.xvel = initX || 0;
    this.yvel = initY || 0;

    this.planted = 0;

    this.currentinput = undefined;
    this.input = {

        Movement: {
            w: false,
            a: false,
            s: false,
            d: false,
        },

        Sprint: {
            Shift: false,
        },

        Interact: {
            " ": false
        },

        Inventory: { // add more when you get the elements in for it
            1: false,
            2: false,
            3: false,
            4: false,
        }

    };

    this.inventory = {

        Selected: 1,

        Prices: {
            Tomato: 1,
            Carrot: 100,
            Strawberry: 2500,
            Pumpkin: 30000
        },

        Worths: {
            Tomato: 2,
            Carrot: 250,
            Strawberry: 3000,
            Pumpkin: 35000
        },

        Currency: {
            Gold: 0
        },

        Seeds: {
            Carrot: 0,
            Tomato: 0,
            Strawberry: 0,
            Pumpkin: 0
        },

    };

    this.interactables = [

        { X: 31, Y: 21 },
        { X: 63, Y: 21 },
        { X: 95, Y: 21 },
        { X: 127, Y: 21 },
        { X: 159, Y: 21 },
        { X: 191, Y: 21 },

        { X: 31, Y: 53 },
        { X: 63, Y: 53 },
        { X: 95, Y: 53 },
        { X: 127, Y: 53 },
        { X: 159, Y: 53 },
        { X: 191, Y: 53 },

        { X: 31, Y: 85 },
        { X: 63, Y: 85 },
        { X: 95, Y: 85 },
        { X: 127, Y: 85 },
        { X: 159, Y: 85 },
        { X: 191, Y: 85 },

        { X: 31, Y: 117 },
        { X: 63, Y: 117 },
        { X: 95, Y: 117 },
        { X: 127, Y: 117 },
        { X: 159, Y: 117 },
        { X: 191, Y: 117 },

        { X: 31, Y: 149 },
        { X: 63, Y: 149 },
        { X: 95, Y: 149 },
        { X: 127, Y: 149 },
        { X: 159, Y: 149 },
        { X: 191, Y: 149 },

        { X: 31, Y: 181 },
        { X: 63, Y: 181 },
        { X: 95, Y: 181 },
        { X: 127, Y: 181 },
        { X: 159, Y: 181 },
        { X: 191, Y: 181 },

        { X: 31, Y: 213 },
        { X: 63, Y: 213 },
        { X: 95, Y: 213 },
        { X: 127, Y: 213 },
        { X: 159, Y: 213 },
        { X: 191, Y: 213 },

    ];

    this.interactablesOcc = [];

    // init method

    Player.prototype.Init = function(){

        onEvent("screen1","keypress",function(k){ if (k.key == "/") { console.log(Player1) } });

        setStyle(this.id, "z-index: 5");

        setStyle("LOADING_SCREEN", "z-index: 10");
        showElement("LOADING_SCREEN");

        Tween.easeScale("LOADING_SCREEN",{W: 1100, H: 1100},{W: 0, H: 0}, 300, "easeOutQuint");

        this.UpdateGold(10);

        this.UpdateAnimation();

    };

    Player.prototype.CheckInteraction = function(){

        for (var i = 0 ; i < this.interactables.length ; i ++) {

            var intx = this.interactables[i].X;
            var inty = this.interactables[i].Y;

            var minx = intx - this.interactrange;
            var maxx = intx + this.interactrange;
            var miny = inty - this.interactrange;
            var maxy = inty + this.interactrange;

            if (checkInRange(getXPosition(this.id), minx, maxx) && checkInRange(getYPosition(this.id), miny, maxy)) { this.inRangeInteract = this.interactables[i]; this.UpdateInteraction(this.interactables[i]) }

        }

    };

    // get methods

    Player.prototype.GetId = function(){ return this.id };

    Player.prototype.GetState = function(){ return this.state };

    Player.prototype.GetDirection = function(){ return this.direction };

    Player.prototype.GetInventory = function(){ return this.inventory };

    Player.prototype.GetInput = function(){ return this.input };

    Player.prototype.GetDirectionFromInput = function(){

        var inputsToDirections = {
            undefined: "d",
            w: "u",
            a: "l",
            s: "d",
            d: "r"
        };

        if (!inputsToDirections[this.currentinput]) { return "d" }

        return inputsToDirections[this.currentinput];

    };

    // set methods

    Player.prototype.SetId = function(_t){ this.id = _t };

    Player.prototype.SetState = function(_t){ this.state = (_t).toLowerCase(); this.UpdateAnimation() };

    Player.prototype.SetDirection = function(_t){ this.direction = (_t).toLowerCase(); this.UpdateAnimation() };

    Player.prototype.SetMovespeed = function(_t){ this.movespeed = _t };

    // update methods

    Player.prototype.UpdatePosition = function(){

        if (this.input.Movement.w ) {
            this.yvel -= this.movespeed;
        } 

        if (this.input.Movement.a ) {
            this.xvel -= this.movespeed;
        }

        if (this.input.Movement.s ) {
            this.yvel += this.movespeed;
        } 

        if (this.input.Movement.d ) {
            this.xvel += this.movespeed;
        }

        setPosition(this.id,this.xvel,this.yvel);
        
    };

    Player.prototype.UpdateAnimation = function(){

        this.animation = String(this.state + "_" + this.GetDirectionFromInput() + ".gif");
        setImageURL(this.id, this.state + "_" + this.GetDirectionFromInput() + ".gif") ;

    };

    Player.prototype.UpdateInventory = function(_type, _item){

        console.log("Add [" + _item + "] to " + this.id + "'s Inventory (" + _type + ")");

    };

    Player.prototype.UpdateInvBar = function(_k){

        this.inventory.Selected = _k;

        var prefix = "INVBAR_NAV_";
        var colortoset = rgb(0,255,0);

        var InvbarItems = {

            1: {Type: "Seeds", Item: "Tomato"},
            2: {Type: "Seeds", Item: "Carrot"},
            3: {Type: "Seeds", Item: "Strawberry"},
            4: {Type: "Seeds", Item: "Pumpkin"},

        };

        for (var i = 1 ; i < 5 ; i ++) { setProperty(prefix + String(i), "text-color", rgb(255,255,255)) }

        setProperty(prefix + String(_k), "text-color", colortoset);

        this.holding = InvbarItems[_k];

    };

    Player.prototype.UpdateInteraction = function(_interactable){

        var id = String(_interactable.X) + String(_interactable.Y);

        for (var i = 0 ; i < this.interactablesOcc.length ; i ++) { if (this.interactablesOcc[i] == id) { return } }

        if (this.holding == undefined) { return }

        if (this.inventory.Currency.Gold < this.inventory.Prices[this.holding.Item]) { return }

        var np = new Plant(id, String(this.holding.Item).toLowerCase(), _interactable, curTime);
        np.Init();

        if (np) { this.planted ++ ; appendItem(this.interactablesOcc, id) }

    };

    Player.prototype.UpdateGold = function(_h){

        if (_h < 0) { 

            Tween.easePosition("MONEY", {X: 225, Y: 368}, {X: 225, Y: 370}, 25, "spikeOut");

         } else {

            Tween.easePosition("MONEY", {X: 225, Y: 368}, {X: 225, Y: 366}, 25, "spikeOut");

        }

        this.inventory.Currency.Gold += _h;
        setProperty("MONEY", "text", String(Player1.inventory.Currency.Gold));

    }
    
    Player.prototype.UpdateInput = function(_k, _t){

        var key = _k.key;

        if (_t) { this.currentinput = key; }
        
        // movement

        if (findItemInArr(returnListFromObj( this.input.Movement ) , key )) {

            if (this.input.Movement[key] == _t) { return }

            this.input.Movement[key] = _t;

            this.SetDirection(this.GetDirectionFromInput(key));

            if (getAllFalse(this.input.Movement)) { this.SetState("idle") }
            if (getAllFalse(this.input.Movement) == false) { this.SetState("run") }

        }

        //

        if (findItemInArr(returnListFromObj( this.input.Sprint ) , key )) {

            if (this.input.Sprint[key] == _t) { return }

            this.input.Sprint[key] = _t;

            if (_t) { this.movespeed = 2 }

            if (!_t) { this.movespeed = 1 }

        }

        if (findItemInArr(returnListFromObj( this.input.Interact ) , key )) {

            if (this.input.Interact[key] == _t) { return }

            this.input.Interact[key] = _t;

            if (_t) { this.CheckInteraction() }

        }

        if (findItemInArr(returnListFromObj( this.input.Inventory ) , key )) {

            if (this.input.Inventory[key] == _t) { return }

            this.input.Inventory[key] = _t;

            if (_t) { this.UpdateInvBar(key) }

        }

    };

}

// init

var Player1 = new Player("PLAYER", "idle", "d", 105, 280);
Player1.Init();

var GameTime = new Time();
GameTime.Init();

// onev

onEvent("screen1","keydown",function(k){ Player1.UpdateInput( k, true ) });
onEvent("screen1","keyup",function(k){ Player1.UpdateInput( k, false ) });

/* citations

Cozy Farm Asset Pack: https://shubibubi.itch.io/cozy-farm
Sprite Pack (Free Version): https://bagong-games.itch.io/hana-caraka-base-character
Tween Library: (i made it)

*/
