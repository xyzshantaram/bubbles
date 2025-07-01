"use strict";
const MOUSE_RADIUS = 60;
document.addEventListener("DOMContentLoaded", init);

function randInt(start, stop) {
    if (start > stop) {
        [start, stop] = [stop, start];
    }
    return start + Math.floor(Math.random() * (stop - start));
}

function randRange(a, b) {
    return a + Math.random() * (b - a);
}

function distance(one, two) {
    return Math.sqrt(
        Math.pow(two.x - one.x, 2) +
        Math.pow(two.y - one.y, 2)
    );
}

function clamp(min, num, max) {
    if (num < min) {
        return min;
    }
    if (num > max) {
        return max;
    }
    return num;
}

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if(max == min){
        h = s = 0; // achromatic
    }else{
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    };
}
// Supports #hex, rgb(), or hsl()
function colorStringToHsl(colorStr) {
    let ctx = colorStringToHsl._ctx;
    if (!ctx) {
        let canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1;
        ctx = canvas.getContext('2d');
        colorStringToHsl._ctx = ctx;
    }
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = colorStr;
    ctx.fillRect(0, 0, 1, 1);
    let [r, g, b] = [...ctx.getImageData(0, 0, 1, 1).data];
    return rgbToHsl(r, g, b);
}

const pairs = (arr) => arr.map((v, i) => arr.slice(i + 1).map(w => [v, w])).flat();

function init() {
    if (getCSSCustomProp('--particles-off')) {
        return;
    }

    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    window.bubbles = new Bubbles(canvas, ctx);

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        window.bubbles.draw();
        window.requestAnimationFrame(draw);
    }

    window.requestAnimationFrame(draw);

    window.addEventListener('resize', function () {
        window.bubbles = new Bubbles(canvas, ctx, window.bubbles.entities);
    })
}

const getCSSCustomProp = (propKey, castAs = 'string', element = document.documentElement) => {
    let response = getComputedStyle(element).getPropertyValue(propKey);
    if (response.length) {
        response = response.replace(/\'|"/g, '').trim();
    } else {
        return null;
    }
    switch (castAs) {
        case 'number':
        case 'int':
            return parseInt(response, 10);
        case 'float':
            return parseFloat(response, 10);
        case 'boolean':
        case 'bool':
            return response === 'true' || response === '1';
    }
    return response;
};

function drawStar(ctx, x, y, radius, points = 5, inset = 0.5, rotation = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.moveTo(
        0 + radius * Math.cos(0),
        0 + radius * Math.sin(0)
    );
    for (let i = 0; i < points * 2; i++) {
        const angle = (Math.PI / points) * i;
        const r = i % 2 === 0 ? radius : radius * inset;
        ctx.lineTo(
            0 + r * Math.cos(angle),
            0 + r * Math.sin(angle)
        );
    }
    ctx.closePath();
    ctx.restore();
}

class Bubble {
    constructor(parent, color, alpha, shape = 'circle', movementType = 'random') {
        this.parent = parent;
        const radiusUpperBound = getCSSCustomProp('--particle-radius-max', 'int');
        const radiusLowerBound = getCSSCustomProp('--particle-radius-min', 'int');
        this.radius = randInt(radiusLowerBound, radiusUpperBound);

        this.pos = {
            x: randInt(0 + this.radius, window.innerWidth - this.radius),
            y: randInt(0 + this.radius, window.innerHeight - this.radius)
        };

        this.movementType = movementType;
        this.center = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        if (movementType === 'radial') {
            this.orbitRadius = distance(this.pos, this.center);
            this.orbitAngle = Math.atan2(this.pos.y - this.center.y, this.pos.x - this.center.x);
            const baseRadialSpeed = parseFloat(getCSSCustomProp('--bubble-radial-speed', 'float')) || 0.002;
            const jitter = randRange(-0.001, 0.001);
            this.orbitSpeed = (baseRadialSpeed / (this.orbitRadius / 120 + 1)) + jitter;
        }

        const randSign = () => Math.random() >= 50 ? 1 : -1;
        const velocityConstant = getCSSCustomProp('--velocity-constant', 'float') || 0.5;
        this.vel = {
            x: randSign() * Math.random() * velocityConstant,
            y: randSign() * Math.random() * velocityConstant,
        };

        this.color = color;
        this.alpha = alpha;
        this.shape = shape;

        this.animationFrame = randInt(0, 10000);
        this._animationFramePrevSec = Math.floor(Date.now() / 1000);

        const spinMin = parseFloat(getCSSCustomProp('--star-spin-min', 'float')) || -0.03;
        const spinMax = parseFloat(getCSSCustomProp('--star-spin-max', 'float')) || 0.03;
        if (this.shape === 'star' || this.shape === 'star-outline') {
            this.rotation = randRange(0, Math.PI * 2);
            this.rotationSpeed = randRange(spinMin, spinMax);
        } else {
            this.rotation = 0;
            this.rotationSpeed = 0;
        }
        // Twinkle: Each bubble gets a unique speed and phase
        this.twinkleSpeed = randRange(0.6, 1.2);
        this.twinklePhase = randRange(0, Math.PI * 2);

        // Cache parsed HSL color for brightness manipulation
        this._baseHSL = colorStringToHsl(this.color);
    }

    // Linear interpolation helper
    lerp(a, b, t) {
        return a + (b - a) * t;
    }

    update() {
        const nowSec = Math.floor(Date.now() / 1000);
        if (nowSec !== this._animationFramePrevSec) {
            this._animationFramePrevSec = nowSec;
            this.animationFrame++;
        }

        if (this.movementType === 'radial') {
            this.orbitAngle += this.orbitSpeed;
            this.pos.x = this.center.x + this.orbitRadius * Math.cos(this.orbitAngle);
            this.pos.y = this.center.y + this.orbitRadius * Math.sin(this.orbitAngle);
        } else {
            this.pos.x += this.vel.x;
            this.pos.y += this.vel.y;
            if (this.pos.x - this.radius * 2 > window.bubbles.width || this.pos.x - this.radius * 2 < 0) {
                this.vel.x *= -1;
            }
            if (this.pos.y - this.radius * 2 > window.bubbles.height || this.pos.y - this.radius < 0) {
                this.vel.y *= -1;
            }
        }
        // Spin for stars
        if (this.shape === 'star' || this.shape === 'star-outline') {
            this.rotation += this.rotationSpeed;
        }
        if (this.isColliding({
            pos: window.bubblesMouse.pos,
            radius: MOUSE_RADIUS
        })) {
            let dx = this.pos.x - window.bubblesMouse.pos.x;
            let dy = this.pos.y - window.bubblesMouse.pos.y;
            let dist = Math.sqrt(dx * dx + dy * dy) || 1;
            let ux = dx / dist;
            let uy = dy / dist;
            let cr = this.radius + MOUSE_RADIUS;
            let targetX = window.bubblesMouse.pos.x + cr * ux;
            let targetY = window.bubblesMouse.pos.y + cr * uy;
            const lerpFactor = getCSSCustomProp('--bubble-lerp-factor', 'float') || 0.2;
            this.pos.x = this.lerp(this.pos.x, targetX, lerpFactor);
            this.pos.y = this.lerp(this.pos.y, targetY, lerpFactor);
            this.vel.x *= -1;
            this.vel.y *= -1;
            this.pos.x = clamp(this.radius, this.pos.x, this.parent.width - this.radius);
            this.pos.y = clamp(this.radius, this.pos.y, this.parent.height - this.radius);
        }
    }

    draw(ctx) {
        this.update();
        // Twinkle as brightness modulation with smoothing (lerp fade)
        let t = this.animationFrame * this.twinkleSpeed + this.twinklePhase;
        let twinkleStyle = (getCSSCustomProp('--bubble-twinkle-style') || 'fade').toLowerCase();
        let tw;
        if (twinkleStyle === 'flash') {
            tw = Math.sin(t) > 0 ? 1.0 : 0.4;
        } else {
            tw = Math.sin(t) * 0.3 + 0.7;
        }

        let h = this._baseHSL.h;
        let s = this._baseHSL.s;
        let baseL = this._baseHSL.l;
        // Target lightness for this frame
        let targetL = clamp(25, baseL * tw, 96);
        // Smoothly lerp lightness
        if (this.twinkleL === undefined) this.twinkleL = baseL;
        this.twinkleL += (targetL - this.twinkleL) * 0.12; // smoothing factor
        let l = this.twinkleL;
        let twinkleColor = `hsl(${h},${s}%,${l}%)`;

        ctx.beginPath();
        if (this.shape === 'star') {
            drawStar(ctx, this.pos.x, this.pos.y, this.radius, 5, 0.5, this.rotation);
            ctx.globalAlpha = this.alpha;
            ctx.closePath();
            ctx.fillStyle = twinkleColor;
            ctx.fill();
        } else if (this.shape === 'star-outline') {
            drawStar(ctx, this.pos.x, this.pos.y, this.radius, 5, 0.5, this.rotation);
            ctx.globalAlpha = this.alpha;
            ctx.closePath();
            ctx.strokeStyle = twinkleColor;
            ctx.lineWidth = 2;
            ctx.stroke();
        } else {
            ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI, false);
            ctx.globalAlpha = this.alpha;
            ctx.closePath();
            ctx.fillStyle = twinkleColor;
            ctx.fill();
        }
    }

    isColliding(that) {
        return (distance(this.pos, that.pos) < this.radius + that.radius);
    }
}

class Bubbles {
    constructor(canvas, ctx, entities = []) {
        Object.assign(canvas.style, {
            position: "fixed",
            left: "0",
            top: "0",
            margin: "0",
            width: "100vw",
            height: "100vh",
            'background-color': getCSSCustomProp('--bubbles-bg') || 'transparent',
            overflow: 'hidden',
            zIndex: '-1'
        });
        this.ctx = ctx;
        this.canvas = canvas;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.color = getCSSCustomProp('--particle-color') || 'orangered';
        let maxAlpha = getCSSCustomProp('--max-alpha', 'int') || 100;
        this.entities = entities;
        let shapePref = getCSSCustomProp('--bubble-shape') || 'circle';
        let movementPref = getCSSCustomProp('--bubble-movement') || 'random';
        if (entities.length === 0) {
            let particleCount = getCSSCustomProp('--particle-count', 'int');
            for (let x = 0; x < particleCount; x++) {
                let shape = 'circle';
                if (shapePref === 'star' || shapePref === 'star-outline' || shapePref === 'circle') {
                    shape = shapePref;
                } else if (shapePref === 'random') {
                    let shapes = ['circle', 'star', 'star-outline'];
                    shape = shapes[randInt(0, shapes.length)];
                }
                let movementType = movementPref === 'random' ? 'random' : (movementPref === 'radial' ? 'radial' : 'random');
                this.entities.push(
                    new Bubble(this, this.color, 0.1 + (randInt(0, maxAlpha) * 0.01), shape, movementType)
                );
            }
        }
        this.entityPairs = pairs(this.entities);
        window.bubblesMouse = window.bubblesMouse || {
            pos: { x: 0, y: 0 }, right: false, left: false
        };
        window.addEventListener('mousemove', (e) => {
            let rect = this.canvas.getBoundingClientRect();
            window.bubblesMouse.pos.x = Math.round(e.clientX - rect.left);
            window.bubblesMouse.pos.y = Math.round(e.clientY - rect.top);
        });
    }

    update() {
        const resolved = [];
        const collidingPairs = this.entityPairs.filter(pair => pair[0].isColliding(pair[1]));
        for (let pair of collidingPairs) {
            if (!resolved.includes(pair)) {
                resolved.push(pair);
                let dx = pair[0].pos.x - pair[1].pos.x;
                let dy = pair[0].pos.y - pair[1].pos.y;
                let dist = Math.sqrt(dx * dx + dy * dy) || 1;
                let ux = dx / dist;
                let uy = dy / dist;
                let cr = pair[0].radius + pair[1].radius;
                pair[0].pos.x = pair[1].pos.x + cr * ux;
                pair[0].pos.y = pair[1].pos.y + cr * uy;
                pair[0].vel.x *= -1;
                pair[0].vel.y *= -1;
                pair[1].vel.x *= -1;
                pair[1].vel.y *= -1;
            }
        }
    }

    draw() {
        this.update();
        for (let bubble of this.entities) {
            bubble.draw(this.ctx);
        }
    }

    drawMouse() {
        this.ctx.beginPath();
        this.ctx.arc(window.bubblesMouse.pos.x, window.bubblesMouse.pos.y, MOUSE_RADIUS, 0, 2 * Math.PI, false);
        this.ctx.globalAlpha = 1;
        this.ctx.closePath();
        this.ctx.fillStyle = 'red';
        this.ctx.fill();
    }
}
