export default class Background {
    constructor() {
        this.clouds = [];
        this.centerX = window.innerWidth / 2;
        this.centerY = window.innerHeight / 2;
        this.radius = 400;
        this.containerName = 'clouds-background';
        this.frameAnimation = null;
    }

    init() {
        this.createClouds();
        this.addStyles();
        this.animate();
    }

    drawCloud(ctx, color, rotation) {
        ctx.save();
        ctx.clearRect(0, 0, 200, 200);
        ctx.translate(100, 100);
        ctx.rotate(rotation);
        ctx.fillStyle = color;
        this.drawCloudShape(ctx);
        ctx.restore();
    }

    drawCloudShape(ctx) {
        ctx.beginPath();
        ctx.arc(-30, 0, 25, 0, Math.PI * 2);
        ctx.arc(0, -20, 30, 0, Math.PI * 2);
        ctx.arc(30, 0, 25, 0, Math.PI * 2);
        ctx.arc(0, 20, 30, 0, Math.PI * 2);
        ctx.fill();
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .cloud {
                position: absolute;
                pointer-events: none;
                transform-origin: 100px 100px;
                filter: blur(5px);
                z-index: -10000;
            }
        `;
        document.head.appendChild(style);
    }

    getBackgroundContainer() {
        return document.querySelector(`.clouds-background`);
    }

    createClouds() {
        const colors = [
            'rgba(255, 255, 255, 0.9)',
            'rgba(200, 220, 255, 0.8)',
            'rgba(230, 230, 230, 0.7)'
        ];

        // Параметры анимации
        const CLOUD_COUNT = 30;                // Общее количество облаков
        const ROTATION_SPEED_MIN = 0.001;      // Минимальная скорость собственного вращения
        const ROTATION_SPEED_MAX = 0.002;      // Максимальная скорость собственного вращения

        // Равномерное распределение облаков
        const angleStep = (Math.PI * 2) / CLOUD_COUNT;

        for (let i = 0; i < CLOUD_COUNT; i++) {
            const cloud = document.createElement('canvas');
            cloud.className = 'cloud';
            cloud.width = 200;
            cloud.height = 200;
            const ctx = cloud.getContext('2d');

            this.clouds.push({
                element: cloud,
                ctx,
                color: colors[i % colors.length],
                angle: angleStep * i,
                rotation: Math.random() * Math.PI * 2,
                speed: ROTATION_SPEED_MIN + Math.random() * (ROTATION_SPEED_MAX - ROTATION_SPEED_MIN),
                radius: this.radius * 0.9 + (this.radius * 0.7 * (i % 10)) // Чередование радиусов
            });

            const container = this.getBackgroundContainer();
            container.appendChild(cloud);
        }
    }

    animate() {
        this.centerX = window.innerWidth / 2;
        this.centerY = window.innerHeight / 2;

        this.clouds.forEach(cloud => {
            cloud.angle += 0.001;
            const x = this.centerX + cloud.radius * Math.cos(cloud.angle);
            const y = this.centerY + cloud.radius * Math.sin(cloud.angle);

            cloud.rotation += cloud.speed;

            cloud.element.style.transform = `
                translate(${x - 100}px, ${y - 100}px)
                rotate(${cloud.rotation}rad)
                scale(${10 + Math.sin(cloud.angle) * 0.1})
            `;

            this.drawCloud(cloud.ctx, cloud.color, cloud.rotation);
        });

        this.frameAnimation = requestAnimationFrame(() => this.animate());
    }

    clearAll() {
        this.frameAnimation = null;
        cancelAnimationFrame(this.frameAnimation);
        this.clouds = [];
        const container = this.getBackgroundContainer();
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
    }
}


