const fs = require('fs');
const { createCanvas } = require('canvas');

const sizes = [192, 512];

function drawIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Градиентный фон
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    
    // Скруглённый квадрат
    const radius = size * 0.2;
    ctx.fillStyle = gradient;
    roundRect(ctx, 0, 0, size, size, radius);
    ctx.fill();

    // Белая основа планера
    const plannerWidth = size * 0.7;
    const plannerHeight = size * 0.5;
    const plannerX = (size - plannerWidth) / 2;
    const plannerY = (size - plannerHeight) / 2 + size * 0.1;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    roundRect(ctx, plannerX, plannerY, plannerWidth, plannerHeight, size * 0.04);
    ctx.fill();

    // Верхняя цветная полоса
    ctx.fillStyle = gradient;
    ctx.fillRect(plannerX, plannerY, plannerWidth, plannerHeight * 0.25);

    // Линии задач
    const lineY = plannerY + plannerHeight * 0.4;
    const lineHeight = plannerHeight * 0.08;
    
    ctx.fillStyle = '#667eea';
    roundRect(ctx, plannerX + size * 0.1, lineY, plannerWidth * 0.6, lineHeight, lineHeight / 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(102, 126, 234, 0.7)';
    roundRect(ctx, plannerX + size * 0.1, lineY + lineHeight * 1.5, plannerWidth * 0.5, lineHeight, lineHeight / 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(118, 75, 162, 0.7)';
    roundRect(ctx, plannerX + size * 0.1, lineY + lineHeight * 3, plannerWidth * 0.55, lineHeight, lineHeight / 2);
    ctx.fill();

    // Галочка
    ctx.strokeStyle = '#28a745';
    ctx.lineWidth = Math.max(3, size * 0.015);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    const checkX = plannerX + size * 0.08;
    const checkY = plannerY + plannerHeight * 0.7;
    const checkSize = size * 0.08;
    ctx.moveTo(checkX, checkY + checkSize * 0.5);
    ctx.lineTo(checkX + checkSize * 0.5, checkY + checkSize);
    ctx.lineTo(checkX + checkSize * 1.2, checkY);
    ctx.stroke();

    return canvas.toBuffer('image/png');
}

function roundRect(ctx, x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

sizes.forEach(size => {
    const buffer = drawIcon(size);
    fs.writeFileSync(`icons/icon-${size}x${size}.png`, buffer);
    console.log(`✅ icon-${size}x${size}.png создана`);
});

console.log('\n🎉 Все иконки созданы!');
