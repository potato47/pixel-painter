import fs from 'fs';

interface IPoint { x: number, y: number, color: string };

export class PixelCanvas {

    private canvas!: HTMLCanvasElement;
    private canvasContainer!: HTMLDivElement;
    private context!: CanvasRenderingContext2D;
    private rows = 10;
    private cols = 10;
    private points: IPoint[][] = [];
    private fillColorProp: any;
    private showGridProp: any;
    private hasGapProp: any;
    private imageSizeProp: any;

    init(canvas: HTMLCanvasElement, fillColorProp: any, showGridProp: any, hasGapProp: any, imageSizeProp: any) {
        if (canvas === this.canvas) {
            return;
        }
        this.fillColorProp = fillColorProp;
        this.showGridProp = showGridProp;
        this.hasGapProp = hasGapProp;
        this.imageSizeProp = imageSizeProp;
        this.canvas = canvas;
        this.canvasContainer = canvas.parentElement as HTMLDivElement;
        this.context = canvas.getContext('2d')!;
        this.addListeners();
        this.resizeCanvas();
    }

    newCanvas(size: number) {
        this.rows = size;
        this.cols = size;
        this.initPoints();
        this.paint();
    }

    addListeners() {
        let isDrawing = false;
        this.canvas.addEventListener('mousedown', (e: MouseEvent) => {
            isDrawing = true;
            this.onPointTouch(e);
        }, false);
        this.canvas.addEventListener('mousemove', (e: MouseEvent) => {
            if (isDrawing) {
                this.onPointTouch(e);
            }
        }, false);
        this.canvas.addEventListener('mouseup', (e: MouseEvent) => isDrawing = false, false);
        // this.canvas.addEventListener('mouseleave', (e: MouseEvent) => isDrawing = false, false);
        const objResizeObserver = new ResizeObserver((entries) => {
            this.resizeCanvas();
            this.paint();
        });
        objResizeObserver.observe(this.canvasContainer);
    }

    onPointTouch(e: MouseEvent) {
        const isEraser = e.ctrlKey;
        const x = e.clientX - this.canvas.getBoundingClientRect().left;
        const y = e.clientY - this.canvas.getBoundingClientRect().top;
        const pointSize = this.canvas.width / this.cols;
        const col = x / pointSize | 0;
        const row = y / pointSize | 0;
        const color = this.fillColorProp.value;
        this.updatePoint(col, row, isEraser ? '' : `rgba(${color[0]},${color[1]},${color[2]},${color[3]})`);
        this.paint();
    }

    updatePoint(x: number, y: number, color: string) {
        if (x < this.points.length && y < this.points[x].length) {
            this.points[x][y] = { x, y, color };
        }
    }

    stepPoints(cb: (point: IPoint) => void) {
        for (let x = 0; x < this.cols; x++) {
            for (let y = 0; y < this.rows; y++) {
                cb(this.points[x][y]);
            }
        }
    }

    initPoints() {
        this.points.length = this.cols;
        for (let x = 0; x < this.cols; x++) {
            this.points[x] = [];
            this.points[x].length = this.rows;
            for (let y = 0; y < this.rows; y++) {
                let color = this.points[x]?.[y]?.color || '';
                this.points[x][y] = { x: x, y: y, color };
            }
        }
    }

    clearPoints() {
        for (let x = 0; x < this.cols; x++) {
            for (let y = 0; y < this.rows; y++) {
                this.points[x][y] = { x: x, y: y, color: '' };
            }
        }
    }

    paint() {
        const cols = this.cols;
        const rows = this.rows;
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        const pointSize = canvasWidth / cols;
        this.context.clearRect(0, 0, canvasWidth, canvasHeight);
        if (this.showGridProp.value) {
            for (let x = 0; x < cols; x++) {
                for (let y = 0; y < rows; y++) {
                    if ((x + y) % 2 === 0) {
                        this.context.fillStyle = '#d9d9d9';
                    } else {
                        this.context.fillStyle = '#ffffff';
                    }
                    this.context.fillRect(pointSize * x, pointSize * y, pointSize, pointSize);
                }
            }
        }

        const hasGap = this.hasGapProp.value;
        this.stepPoints(point => {
            if (point.color) {
                this.context.fillStyle = point.color;
                const x = point.x * pointSize + (hasGap ? 0.1 * pointSize : 0);
                const y = point.y * pointSize + (hasGap ? 0.1 * pointSize : 0);
                const w = hasGap ? 0.8 * pointSize : pointSize;
                this.context.fillRect(x, y, w, w);
            }
        });
    }

    resizeCanvas() {
        const width = Math.min(this.canvasContainer.clientWidth, this.canvasContainer.clientHeight) * 0.9;
        this.canvas.width = width;
        this.canvas.height = width;
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = width + 'px';
    }

    exportCanvasAsPNG(filePath: string) {
        let imgUrl: string;
        const exportSize = this.imageSizeProp.value;
        const originSize = this.canvas.width;
        this.canvas.width = exportSize;
        this.canvas.height = exportSize;
        if (this.showGridProp.value) {
            this.showGridProp.value = false;
            this.paint();
            imgUrl = this.canvas.toDataURL();
            this.showGridProp.value = true;
        } else {
            this.paint();
            imgUrl = this.canvas.toDataURL();
        }
        this.canvas.width = originSize;
        this.canvas.height = originSize;
        this.paint();
        const base64 = imgUrl.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64, 'base64');
        fs.writeFileSync(filePath, buffer);
        Editor.Task.addNotice({
            title: '?????????',
            message: '???????????????',
            type: 'success',
            timeout: 2000,
        });
    }
}
