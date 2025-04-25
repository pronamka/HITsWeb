export class Canvas {
    static canvasId = 'algorithm-neural-network-drawing-canvas';

    constructor() {
        this.canvas = document.getElementById(Canvas.canvasId);
        this.canvasContext = this.canvas.getContext('2d');

        this.canvasOffsetX = this.canvas.offsetLeft;
        this.canvasOffsetY = this.canvas.offsetTop;

        this.canvas.width = Math.min(
            616,
            Math.floor((window.innerWidth - this.canvasOffsetY - 300) / 28) * 28
        );
        this.canvas.height = this.canvas.width;

        this.isPainting = false;
        this.lineWidth = 30;

        this.canvasContext.lineWidth = this.lineWidth;
        this.canvasContext.lineCap = 'round';
        this.canvasContext.strokeStyle = 'black';

        this.addListeners();
    }

    addListeners() {
        this.canvas.addEventListener('mousedown', (e) => {
            this.isPainting = true;
        });

        this.canvas.addEventListener('mouseup', (e) => {
            this.isPainting = false;
            this.canvasContext.stroke();
            this.canvasContext.beginPath();
        });

        this.canvas.addEventListener('mouseleave', (e) => {
            this.isPainting = false;
            this.canvasContext.stroke();
            this.canvasContext.beginPath();
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isPainting) {
                return;
            }
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.canvasContext.lineTo(x, y);
            this.canvasContext.stroke();
        });
    }
}
