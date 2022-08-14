import { readFileSync } from 'fs-extra';
import { join } from 'path';
import { createApp, App } from 'vue';
import { PixelCanvas } from './PixelCanvas';
import path from 'path';
const weakMap = new WeakMap<any, App>();
/**
 * @zh 如果希望兼容 3.3 之前的版本可以使用下方的代码
 * @en You can add the code below if you want compatibility with versions prior to 3.3
 */
// Editor.Panel.define = Editor.Panel.define || function(options: any) { return options }
module.exports = Editor.Panel.define({
    listeners: {
        show() { },
        hide() { },
    },
    template: readFileSync(join(__dirname, '../../../static/template/default/index.html'), 'utf-8'),
    style: readFileSync(join(__dirname, '../../../static/style/default/index.css'), 'utf-8'),
    $: {
        app: '#app',
    },
    ready() {
        if (!this.$.app) {
            return;
        }
        const app = createApp({});
        const pixelCanvas = new PixelCanvas();
        app.config.compilerOptions.isCustomElement = (tag) => tag.startsWith('ui-');
        app.component('drawing-board', {
            template: readFileSync(join(__dirname, '../../../static/template/vue/drawing-board.html'), 'utf-8'),
            mounted() {
                pixelCanvas.init(this.$refs.pixelCanvas, this.$refs.fillColor, this.$refs.showGrid, this.$refs.hasGap, this.$refs.imageSize);
                pixelCanvas.newCanvas(+this.$refs.gridSize.value);
            },
            methods: {
                onBtnExport() {
                    Editor.Dialog.save().then(data => {
                        if (!data.canceled && data.filePath) {
                            pixelCanvas.exportCanvasAsPNG(data.filePath);
                        }
                    });
                },
                onBtnExportToProject() {
                    const filePath = path.join(Editor.Project.path, 'assets/', `img_${Date.now()}.png`);
                    pixelCanvas.exportCanvasAsPNG(filePath);
                    Editor.Message.send('asset-db', 'refresh-asset', filePath);
                },
                onBtnNewCanvas() {
                    pixelCanvas.newCanvas(+this.$refs.gridSize.value);
                },
                onCheckShowGrid() {
                    pixelCanvas.paint();
                },
                onCheckHasGap() {
                    pixelCanvas.paint();
                },
            },
        });
        app.mount(this.$.app);
        weakMap.set(this, app);
    },
    beforeClose() { },
    close() {
        const app = weakMap.get(this);
        if (app) {
            app.unmount();
        }
    },
});
