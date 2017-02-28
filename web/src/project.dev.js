require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"AliasedTexture":[function(require,module,exports){
"use strict";
cc._RFpush(module, 'bf7c8Ck+75ETI6s9XQtpXoz', 'AliasedTexture');
// js/AliasedTexture.js

cc.macro.FIX_ARTIFACTS_BY_STRECHING_TEXEL = 1;

cc.Class({
    "extends": cc.Component,

    // use this for initialization
    onLoad: function onLoad() {
        cc.view.enableAntiAlias(false);
    }

});
// called every frame, uncomment this function to activate update callback
// update: function (dt) {

// },

cc._RFpop();
},{}],"AudioControl":[function(require,module,exports){
"use strict";
cc._RFpush(module, '3cd4cOI5slEVp95Slhir+ax', 'AudioControl');
// js/audio/AudioControl.js

window.AudioContext = window.AudioContext || window.webkitAudioContext;

cc.Class({
    "extends": cc.Component,

    properties: {
        voiceLevel: 0,
        _inited: false,
        _audioContext: null,
        _audioInput: null,
        _analyserNode: null,
        _freqByteData: null
    },

    // use this for initialization
    onLoad: function onLoad() {
        this._audioContext = new AudioContext();

        if (!navigator.getUserMedia) navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        if (!navigator.cancelAnimationFrame) navigator.cancelAnimationFrame = navigator.webkitCancelAnimationFrame || navigator.mozCancelAnimationFrame;
        if (!navigator.requestAnimationFrame) navigator.requestAnimationFrame = navigator.webkitRequestAnimationFrame || navigator.mozRequestAnimationFrame;

        var self = this;
        navigator.getUserMedia({
            "audio": {
                "mandatory": {
                    "googEchoCancellation": "false",
                    "googAutoGainControl": "false",
                    "googNoiseSuppression": "false",
                    "googHighpassFilter": "false"
                },
                "optional": []
            }
        }, function (stream) {
            // Create analyser node
            var audioContext = self._audioContext;
            var inputPoint = audioContext.createGain();

            var audioInput = audioContext.createMediaStreamSource(stream);
            audioInput.connect(inputPoint);

            var analyserNode = audioContext.createAnalyser();
            analyserNode.fftSize = 2048;
            inputPoint.connect(analyserNode);

            var freqByteData = new Uint8Array(analyserNode.frequencyBinCount);
            analyserNode.getByteFrequencyData(freqByteData);

            self._freqByteData = freqByteData;
            self._analyserNode = analyserNode;
            self._audioInput = audioInput;

            self._inited = true;
        }, function (e) {
            alert('Error getting audio');
            console.log(e);
            self._inited = false;
        });
    },

    // called every frame, uncomment this function to activate update callback
    update: function update(dt) {
        if (this._inited) {
            var analyser = this._analyserNode,
                freqByteData = this._freqByteData;
            analyser.getByteFrequencyData(freqByteData);
            var sum = 0;
            for (var i = 0; i < freqByteData.length; i++) {
                sum += freqByteData[i];
            }
            this.voiceLevel = sum / freqByteData.length;
        }
    }
});

cc._RFpop();
},{}],"Camera":[function(require,module,exports){
"use strict";
cc._RFpush(module, '6eed1UYZYlAu6cvNSaCHo9v', 'Camera');
// js/Camera.js

var math;
var view;

cc.Class({
    "extends": cc.Component,

    properties: {
        target: cc.Node,
        offset: cc.Vec2
    },

    // use this for initialization
    onLoad: function onLoad() {
        math = cc.math;
        view = cc.view;

        this._tracking = false;
        var targetTrans = this.target.getNodeToWorldTransform();
        this._prevPos = cc.v2(0, 0);
    },

    // called every frame, uncomment this function to activate update callback
    lateUpdate: function lateUpdate(dt) {
        if (!this.target) {
            return;
        }
        var targetX = this.target.x,
            targetY = this.target.y,
            winW = cc.winSize.width,
            winH = cc.winSize.height,
            mapW = this.node.width,
            mapH = this.node.height;

        if (this._prevPos.x !== targetX || this._prevPos.y !== targetY) {
            var appx = this.node._anchorPoint.x * mapW;
            var appy = this.node._anchorPoint.y * mapH;

            var worldx = winW / 2 - (appx + targetX + this.offset.x);
            var worldy = winH / 2 - (appy + targetY + this.offset.y);

            if (worldx > 0) {
                worldx = 0;
            }
            if (winW - worldx > mapW) {
                worldx = winW - mapW;
            }
            if (worldy > 0) {
                worldy = 0;
            }
            if (winH - worldy > mapH) {
                worldy = winH - mapH;
            }
            var parentTrans = this.node.parent.getNodeToWorldTransformAR();
            this.node.x = worldx + appx - parentTrans.tx;
            this.node.y = worldy + appy - parentTrans.ty;

            this._prevPos.x = targetX;
            this._prevPos.y = targetY;
        }
    }
});

cc._RFpop();
},{}],"HeroControl":[function(require,module,exports){
"use strict";
cc._RFpush(module, '97dd4DqVgBDHr8ug35nMSAW', 'HeroControl');
// js/HeroControl.js


cc.Class({
    'extends': cc.Component,

    properties: {
        audioControl: require('AudioControl'),
        speed: cc.v2(0, 0),
        maxSpeed: cc.v2(2000, 2000),
        gravity: -1000,
        drag: 1000,
        direction: 0,
        jumpSpeed: 300,
        runVoiceLevel: 15,
        jumpVoiceLevel: 40,
        jumpAudio: cc.AudioClip,
        dieAudio: cc.AudioClip,
        deathFrame: cc.SpriteFrame,
        replayBtn: cc.Node
    },

    // use this for initialization
    onLoad: function onLoad() {
        cc.director.getCollisionManager().enabled = true;
        // cc.director.getCollisionManager().enabledDebugDraw = true;

        // this.registerEvent();

        this.prePosition = cc.v2();
        this.preStep = cc.v2();

        this.touchingNumber = 0;

        this._startPoint = cc.v2(this.node.x, this.node.y);
        this._dead = false;
    },

    replay: function replay() {
        this.replayBtn.active = false;

        this.collisionX = 0;
        this.collisionY = 0;
        this.speed.x = 0;
        this.speed.y = 0;
        this.direction = 0;
        this.prePosition.x = 0;
        this.prePosition.y = 0;
        this.preStep.x = 0;
        this.preStep.y = 0;
        this.touchingNumber = 0;
        this._dead = false;

        this.node.x = this._startPoint.x;
        this.node.y = this._startPoint.y;
        this.getComponent(cc.Animation).play('stand');
    },

    registerEvent: function registerEvent() {
        //add keyboard input listener to call turnLeft and turnRight
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyPressed, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyReleased, this);
    },

    onDisabled: function onDisabled() {
        cc.director.getCollisionManager().enabled = false;
        // cc.director.getCollisionManager().enabledDebugDraw = false;
    },

    onKeyPressed: function onKeyPressed(event) {
        switch (event.keyCode) {
            case cc.KEY.a:
            case cc.KEY.left:
                this.direction = -1;
                break;
            case cc.KEY.d:
            case cc.KEY.right:
                this.direction = 1;
                break;
            case cc.KEY.w:
            case cc.KEY.up:
                if (!this.jumping) {
                    this.jumping = true;
                    this.speed.y = this.jumpSpeed;
                }
                break;
        }
    },

    onKeyReleased: function onKeyReleased(event) {
        switch (event.keyCode) {
            case cc.KEY.a:
            case cc.KEY.left:
            case cc.KEY.d:
            case cc.KEY.right:
                this.direction = 0;
                break;
        }
    },

    onCollisionEnter: function onCollisionEnter(other, self) {
        // this.node.color = cc.Color.RED;

        this.touchingNumber++;

        var transParent = this.node.parent.getNodeToWorldTransformAR();

        // 1st step
        // get pre aabb, go back before collision
        var otherAabb = other.world.aabb;
        var otherPreAabb = other.world.preAabb.clone();

        var selfAabb = self.world.aabb;
        var selfPreAabb = self.world.preAabb.clone();

        // 2nd step
        // forward x-axis, check whether collision on x-axis
        selfPreAabb.x = selfAabb.x;
        otherPreAabb.x = otherAabb.x;

        var appx = this.node.anchorX * selfAabb.width;
        var appy = this.node.anchorY * selfAabb.height;

        if (cc.Intersection.rectRect(selfPreAabb, otherPreAabb)) {
            if (this.speed.x < 0 && selfPreAabb.xMax > otherPreAabb.xMax) {
                this.node.x = otherPreAabb.xMax - transParent.tx + appx;
                this.collisionX = -1;
            } else if (this.speed.x > 0 && selfPreAabb.xMin < otherPreAabb.xMin) {
                this.node.x = otherPreAabb.xMin - selfPreAabb.width - transParent.tx + appx;
                this.collisionX = 1;
            }

            this.speed.x = 0;
            other.touchingX = true;
            return;
        }

        // 3rd step
        // forward y-axis, check whether collision on y-axis
        selfPreAabb.y = selfAabb.y;
        otherPreAabb.y = otherAabb.y;

        if (cc.Intersection.rectRect(selfPreAabb, otherPreAabb)) {
            if (this.speed.y < 0 && selfPreAabb.yMax > otherPreAabb.yMax) {
                this.node.y = otherPreAabb.yMax - transParent.ty + appy;
                this.jumping = false;
                this.collisionY = -1;
            } else if (this.speed.y > 0 && selfPreAabb.yMin < otherPreAabb.yMin) {
                this.node.y = otherPreAabb.yMin - selfPreAabb.height - transParent.ty + appy;
                this.speed.y = 0;
                this.collisionY = 1;
            }

            this.speed.y = 0;
            other.touchingY = true;
        }
    },

    onCollisionStay: function onCollisionStay(other, self) {
        if (this.collisionY === -1) {
            if (other.node.group === 'Platform') {
                var motion = other.node.getComponent('PlatformMotion');
                if (motion) {
                    this.node.x += motion._movedDiff;
                }
            }

            // this.node.y = other.world.aabb.yMax;

            // var offset = cc.v2(other.world.aabb.x - other.world.preAabb.x, 0);

            // var temp = cc.affineTransformClone(self.world.transform);
            // temp.tx = temp.ty = 0;

            // offset = cc.pointApplyAffineTransform(offset, temp);
            // this.node.x += offset.x;
        }
    },

    onCollisionExit: function onCollisionExit(other) {
        this.touchingNumber--;
        if (this.touchingNumber === 0) {
            this.node.color = cc.Color.WHITE;
        }

        if (other.touchingX) {
            this.collisionX = 0;
            other.touchingX = false;
        } else if (other.touchingY) {
            other.touchingY = false;
            this.collisionY = 0;
            this.jumping = true;
        }
    },

    update: function update(dt) {
        if (this._dead) {
            return;
        }
        var voiceLevel = this.audioControl.voiceLevel;
        var animation = this.getComponent(cc.Animation);

        // Voice control jump
        if (!this.jumping && voiceLevel > this.jumpVoiceLevel) {
            this.jumping = true;
            this.direction = 1;
            this.speed.y = voiceLevel / 100 * this.jumpSpeed;
            cc.audioEngine.play(this.jumpAudio, false, 1);
            animation.play('jump');
        }

        if (!this.jumping) {
            var runState = animation.getAnimationState('run');
            var standState = animation.getAnimationState('stand');
            // Voice control run
            if (voiceLevel > this.runVoiceLevel) {
                this.direction = 1;
                if (!runState.isPlaying) {
                    animation.play('run');
                }
            } else {
                this.direction = 0;
                if (!standState.isPlaying) {
                    animation.play('stand');
                }
            }
        }

        if (this.collisionY >= 0) {
            this.speed.y += this.gravity * dt;
            if (Math.abs(this.speed.y) > this.maxSpeed.y) {
                this.speed.y = this.speed.y > 0 ? this.maxSpeed.y : -this.maxSpeed.y;
            }
        }

        if (this.direction === 0) {
            if (this.speed.x > 0) {
                this.speed.x -= this.drag * dt;
                if (this.speed.x <= 0) this.speed.x = 0;
            } else if (this.speed.x < 0) {
                this.speed.x += this.drag * dt;
                if (this.speed.x >= 0) this.speed.x = 0;
            }
        } else {
            this.speed.x += (this.direction > 0 ? 1 : -1) * this.drag * dt;
            if (Math.abs(this.speed.x) > this.maxSpeed.x) {
                this.speed.x = this.speed.x > 0 ? this.maxSpeed.x : -this.maxSpeed.x;
            }
        }

        if (this.speed.x * this.collisionX > 0) {
            this.speed.x = 0;
        }

        this.prePosition.x = this.node.x;
        this.prePosition.y = this.node.y;

        this.preStep.x = this.speed.x * dt;
        this.preStep.y = this.speed.y * dt;

        this.node.x += this.speed.x * dt;
        this.node.y += this.speed.y * dt;

        if (this.node.y < -90) {
            this._dead = true;
            cc.audioEngine.play(this.dieAudio, false, 1);
            animation.stop();
            this.getComponent(cc.Sprite).spriteFrame = this.deathFrame;
            this.replayBtn.active = true;
        }
    }
});

cc._RFpop();
},{"AudioControl":"AudioControl"}]},{},["AliasedTexture","Camera","HeroControl","AudioControl"]);
