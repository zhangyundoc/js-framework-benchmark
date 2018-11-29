import { testTextContains, testTextNotContained, testClassContains, testElementLocatedByXpath, testElementNotLocatedByXPath, testElementLocatedById, clickElementById, clickElementByXPath, getTextByXPath } from './webdriverAccess'
import { Builder, WebDriver, promise, logging } from 'selenium-webdriver'
import { config, FrameworkData } from './common'

export enum BenchmarkType { CPU, MEM, STARTUP };

const SHORT_TIMEOUT = 20 * 1000;

export interface BenchmarkInfo {
    id: string;
    type: BenchmarkType;
    label: string;
    description: string;
    throttleCPU?: number
}

export abstract class Benchmark {
    id: string;
    type: BenchmarkType;
    label: string;
    description: string;
    throttleCPU?: number;

    constructor(public benchmarkInfo: BenchmarkInfo) {
        this.id = benchmarkInfo.id;
        this.type = benchmarkInfo.type;
        this.label = benchmarkInfo.label;
        this.description = benchmarkInfo.description;
        this.throttleCPU = benchmarkInfo.throttleCPU;
    }
    abstract init(driver: WebDriver, framework: FrameworkData): Promise<any>;
    abstract run(driver: WebDriver, framework: FrameworkData): Promise<any>;
    after(driver: WebDriver, framework: FrameworkData): Promise<any> { return null; }
    // Good fit for a single result creating Benchmark
    resultKinds(): Array<BenchmarkInfo> { return [this.benchmarkInfo]; }
    extractResult(results: any[], resultKind: BenchmarkInfo): number[] { return results; };
}

export interface LighthouseData {
    TimeToConsistentlyInteractive: number;
    ScriptBootUpTtime: number;
    MainThreadWorkCost: number;
    TotalKiloByteWeight: number;
    [propName: string]: number;
}

export interface StartupBenchmarkResult extends BenchmarkInfo {
    property: keyof LighthouseData;
}

const benchRun = new class extends Benchmark {
    constructor() {
        super({
            id: "01_run1k",
            label: "创建行",
            description: "页面加载完毕后创建1000行所需要的时间",
            type: BenchmarkType.CPU
        })
    }
    async init(driver: WebDriver) { await testElementLocatedById(driver, "add", SHORT_TIMEOUT); }
    async run(driver: WebDriver) {
        await clickElementById(driver, "add");
        await testElementLocatedByXpath(driver, "//tbody/tr[1000]/td[2]/a");
    }
}

const benchReplaceAll = new class extends Benchmark {
    constructor() {
        super({
            id: "02_replace1k",
            label: "替换所有行",
            description: "更新表格里全部的1000行所需要的时间 (包括 " + config.WARMUP_COUNT + " 次预热迭代)",
            type: BenchmarkType.CPU
        })
    }
    async init(driver: WebDriver) {
        await testElementLocatedById(driver, 'run', SHORT_TIMEOUT);
        for (let i = 0; i < config.WARMUP_COUNT; i++) {
            await clickElementById(driver, 'run');
            await testTextContains(driver, '//tbody/tr[1]/td[1]', (i*1000+1).toFixed());
        }
    }
    async run(driver: WebDriver) {
        await clickElementById(driver, 'run');
        await testTextContains(driver, '//tbody/tr[1]/td[1]', '5001');
    }
}

// const benchUpdate = new class extends Benchmark {
//     constructor() {
//         super({
//             id: "03_update10th1k",   // FIXME rename to now 03_update10th10k
//             label: "partial update",
//             description: "Time to update the text of every 10th row (with " + config.WARMUP_COUNT + " warmup iterations) for a table with 10k rows.",
//             type: BenchmarkType.CPU
//         })
//     }
//     async init(driver: WebDriver) {
//         await testElementLocatedById(driver, "runlots", SHORT_TIMEOUT);
//         await clickElementById(driver, 'runlots');
//         await testElementLocatedByXpath(driver, "//tbody/tr[1000]/td[2]/a");
//         for (let i = 0; i < config.WARMUP_COUNT; i++) {
//             await clickElementById(driver, 'update');
//             await testTextContains(driver, '//tbody/tr[9991]/td[2]/a', ' !!!'.repeat(i + 1));
//         }
//     }
//     async run(driver: WebDriver) {
//         await clickElementById(driver, 'update');
//         await testTextContains(driver, '//tbody/tr[9991]/td[2]/a', ' !!!'.repeat(config.WARMUP_COUNT + 1));
//     }
// }

const benchUpdate = new class extends Benchmark {
    constructor() {
        super({
            id: "03_update10th1k_x16",
            label: "部分更新",
            description: "对于一个1000行的表格每10行一更新所需要的时间 (包含 3 次预热迭代)。模拟16倍CPU减速",
            type: BenchmarkType.CPU,
            throttleCPU: 16
        })
    }
    async init(driver: WebDriver) {
        await testElementLocatedById(driver, "run", SHORT_TIMEOUT);
        await clickElementById(driver, 'run');
        await testElementLocatedByXpath(driver, "//tbody/tr[1000]/td[2]/a");
        for (let i = 0; i < 3; i++) {
            await clickElementById(driver, 'update');
            await testTextContains(driver, '//tbody/tr[991]/td[2]/a', ' !!!'.repeat(i + 1));
        }
    }
    async run(driver: WebDriver) {
        await clickElementById(driver, 'update');
        await testTextContains(driver, '//tbody/tr[991]/td[2]/a', ' !!!'.repeat(3 + 1));
    }
}

const benchSelect = new class extends Benchmark {
    constructor() {
        super({
            id: "04_select1k",
            label: "选择行",
            description: "点击某一行后该行倍高亮显示所需要的时间 (包含 " + config.WARMUP_COUNT + " 次预热迭代)。模拟16倍CPU减速",
            type: BenchmarkType.CPU,
            throttleCPU: 16
        })
    }
    async init(driver: WebDriver) {
        await testElementLocatedById(driver, "run", SHORT_TIMEOUT);
        await clickElementById(driver, 'run');
        await testElementLocatedByXpath(driver, "//tbody/tr[1]/td[2]/a");
        for (let i = 0; i <= config.WARMUP_COUNT; i++) {
            await clickElementByXPath(driver, `//tbody/tr[${i + 1}]/td[2]/a`);
        }
    }
    async run(driver: WebDriver) {
        await clickElementByXPath(driver, "//tbody/tr[2]/td[2]/a");
        await testClassContains(driver, "//tbody/tr[2]", "danger");
    }
}

const benchSwapRows = new class extends Benchmark {
    constructor() {
        super({
            id: "05_swap1k",
            label: "交换行",
            description: "在一个1000行的表格中交换两行所需要的时间 (包含 " + config.WARMUP_COUNT + " 次预热迭代)。模拟4倍CPU减速",
            type: BenchmarkType.CPU,
            throttleCPU: 4
        })
    }
    async init(driver: WebDriver) {
        await testElementLocatedById(driver, "run", SHORT_TIMEOUT);
        await clickElementById(driver, 'run');
        await testElementLocatedByXpath(driver, "//tbody/tr[1]/td[2]/a");
        for (let i = 0; i <= config.WARMUP_COUNT; i++) {
            let text = await getTextByXPath(driver, "//tbody/tr[2]/td[2]/a")
            await clickElementById(driver, 'swaprows');
            await testTextContains(driver, "//tbody/tr[999]/td[2]/a", text);
        }
    }
    async run(driver: WebDriver) {
        let text = await getTextByXPath(driver, "//tbody/tr[2]/td[2]/a");
        await clickElementById(driver, 'swaprows');
        await testTextContains(driver, "//tbody/tr[999]/td[2]/a", text);
    }
}

const benchRemove = new class extends Benchmark {
    constructor() {
        super({
            id: "06_remove-one-1k",
            label: "移除行",
            description: "移除一行所需要的时间 (包含 " + config.WARMUP_COUNT + " 次预热迭代)",
            type: BenchmarkType.CPU
        })
    }
    async init(driver: WebDriver) {
        await testElementLocatedById(driver, "run", SHORT_TIMEOUT);
        await clickElementById(driver, 'run');
        await testElementLocatedByXpath(driver, "//tbody/tr[1]/td[2]/a");
        for (let i = 0; i < config.WARMUP_COUNT; i++) {
            await testTextContains(driver, `//tbody/tr[${config.WARMUP_COUNT - i + 4}]/td[1]`, (config.WARMUP_COUNT - i + 4).toString());
            await clickElementByXPath(driver, `//tbody/tr[${config.WARMUP_COUNT - i + 4}]/td[3]/a/span[1]`);
            await testTextContains(driver, `//tbody/tr[${config.WARMUP_COUNT - i + 4}]/td[1]`, '10');
        }
        await testTextContains(driver, '//tbody/tr[5]/td[1]', '10');
        await testTextContains(driver, '//tbody/tr[4]/td[1]', '4');
    }
    async run(driver: WebDriver) {
        await clickElementByXPath(driver, "//tbody/tr[4]/td[3]/a/span[1]");
        await testTextContains(driver, '//tbody/tr[4]/td[1]', '10');
    }
}

const benchRunBig = new class extends Benchmark {
    constructor() {
        super({
            id: "07_create10k",
            label: "移除多行",
            description: "创建10000行所需要的时间",
            type: BenchmarkType.CPU
        })
    }
    async init(driver: WebDriver) {
        await testElementLocatedById(driver, "runlots", SHORT_TIMEOUT);
    }
    async run(driver: WebDriver) {
        await clickElementById(driver, 'runlots');
        await testElementLocatedByXpath(driver, "//tbody/tr[10000]/td[2]/a");
    }
}

// const benchAppendToManyRows = new class extends Benchmark {
//     constructor() {
//         super({
//             id: "08_create1k-after10k",
//             label: "append rows to large table",
//             description: "Duration for adding 1000 rows on a table of 10,000 rows.",
//             type: BenchmarkType.CPU
//         })
//     }
//     async init(driver: WebDriver) {
//         await testElementLocatedById(driver, "runlots", SHORT_TIMEOUT);
//         await clickElementById(driver, 'runlots');
//         await testElementLocatedByXpath(driver, "//tbody/tr[10000]/td[2]/a");
//     }
//     async run(driver: WebDriver) {
//         await clickElementById(driver, 'add');
//         await testElementLocatedByXpath(driver, "//tbody/tr[11000]/td[2]/a");
//     }
// }

const benchAppendToManyRows = new class extends Benchmark {
    constructor() {
        super({
            id: "08_create1k-after1k_x2",
            label: "向大型表格尾部追加行",
            description: "向一个10000行的表格添加1000行所需要的时间。模拟2倍CPU减速",
            type: BenchmarkType.CPU,
            throttleCPU: 2
        })
    }
    async init(driver: WebDriver) {
        await testElementLocatedById(driver, "run", SHORT_TIMEOUT);
        await clickElementById(driver, 'run');
        await testElementLocatedByXpath(driver, "//tbody/tr[1000]/td[2]/a");
    }
    async run(driver: WebDriver) {
        await clickElementById(driver, 'add');
        await testElementLocatedByXpath(driver, "//tbody/tr[1100]/td[2]/a");
    }
}

// const benchClear = new class extends Benchmark {
//     constructor() {
//         super({
//             id: "09_clear10k",
//             label: "clear rows",
//             description: "Duration to clear the table filled with 10.000 rows.",
//             type: BenchmarkType.CPU
//         })
//     }
//     async init(driver: WebDriver) {
//         await testElementLocatedById(driver, "runlots", SHORT_TIMEOUT);
//         await clickElementById(driver, 'runlots');
//         await testElementLocatedByXpath(driver, "//tbody/tr[10000]/td[2]/a");
//     }
//     async run(driver: WebDriver) {
//         await clickElementById(driver, 'clear');
//         await testElementNotLocatedByXPath(driver, "//tbody/tr[1]");
//     }
// }

const benchClear = new class extends Benchmark {
    constructor() {
        super({
            id: "09_clear1k_x8",
            label: "清空行",
            description: "清空一个填充了1000行的表格所需要的时间。模拟8倍CPU减速",
            type: BenchmarkType.CPU,
            throttleCPU: 8
        })
    }
    async init(driver: WebDriver) {
        await testElementLocatedById(driver, "run", SHORT_TIMEOUT);
        await clickElementById(driver, 'run');
        await testElementLocatedByXpath(driver, "//tbody/tr[1000]/td[2]/a");
    }
    async run(driver: WebDriver) {
        await clickElementById(driver, 'clear');
        await testElementNotLocatedByXPath(driver, "//tbody/tr[1]");
    }
}

const benchReadyMemory = new class extends Benchmark {
    constructor() {
        super({
            id: "21_ready-memory",
            label: "内存数据",
            description: "页面加载后的内存使用情况",
            type: BenchmarkType.MEM,
        })
    }
    async init(driver: WebDriver) {
        await testElementLocatedById(driver, "add", SHORT_TIMEOUT);
    }
    async run(driver: WebDriver) {
        await testElementNotLocatedByXPath(driver, "//tbody/tr[1]");
    }
    async after(driver: WebDriver, framework: FrameworkData) {
        await clickElementById(driver, 'run');
        await testElementLocatedByXpath(driver, "//tbody/tr[1]/td[2]/a");
    }
}

const benchRunMemory = new class extends Benchmark {
    constructor() {
        super({
            id: "22_run-memory",
            label: "运行内存",
            description: "添加1000行后的内存使用情况",
            type: BenchmarkType.MEM,
        })
    }
    async init(driver: WebDriver) {
        await testElementLocatedById(driver, "add", SHORT_TIMEOUT);
    }
    async run(driver: WebDriver) {
        await clickElementById(driver, 'run');
        await testElementLocatedByXpath(driver, "//tbody/tr[1]/td[2]/a");
    }
}

const benchUpdate5Memory = new class extends Benchmark {
    constructor() {
        super({
            id: "23_update5-memory",
            label: "1000行数据每10个一更新 (5 个循环)",
            description: "1000行数据每10个一更新，循环5次后的内存使用情况",
            type: BenchmarkType.MEM,
        })
    }
    async init(driver: WebDriver) {
        await testElementLocatedById(driver, "add", SHORT_TIMEOUT);
    }
    async run(driver: WebDriver) {
        await clickElementById(driver, 'run');
        for (let i = 0; i < 5; i++) {
            await clickElementById(driver, 'update');
            await testTextContains(driver, '//tbody/tr[1]/td[2]/a', ' !!!'.repeat(i));
        }
    }
}

const benchReplace5Memory = new class extends Benchmark {
    constructor() {
        super({
            id: "24_run5-memory",
            label: "替换1000行 (5 个循环)",
            description: "5次重新创建1000行后内存使用情况",
            type: BenchmarkType.MEM,
        })
    }
    async init(driver: WebDriver) {
        await testElementLocatedById(driver, "add", SHORT_TIMEOUT);
    }
    async run(driver: WebDriver) {
        for (let i = 0; i < 5; i++) {
            await clickElementById(driver, 'run');
            await testTextContains(driver, "//tbody/tr[1000]/td[1]", (1000 * (i + 1)).toFixed());
        }
    }
}

const benchCreateClear5Memory = new class extends Benchmark {
    constructor() {
        super({
            id: "25_run-clear-memory",
            label: "创建/清空1000行 (5 个循环)",
            description: "5次创建/清空1000行后内存使用情况",
            type: BenchmarkType.MEM,
        })
    }
    async init(driver: WebDriver) {
        await testElementLocatedById(driver, "add", SHORT_TIMEOUT);
    }
    async run(driver: WebDriver) {
        for (let i = 0; i < 5; i++) {
            await clickElementById(driver, 'run');
            await testTextContains(driver, "//tbody/tr[1000]/td[1]", (1000 * (i + 1)).toFixed());
            await clickElementById(driver, 'clear');
            await testElementNotLocatedByXPath(driver, "//tbody/tr[1000]/td[1]");
        }
    }
}

const benchStartupConsistentlyInteractive: StartupBenchmarkResult = {
    id: "31_startup-ci",
    label: "持续交互",
    description: "悲观传输时间间隔 - 当CPU和网络都很空闲的时候。 (没有其他超过50ms的CPU任务)",
    type: BenchmarkType.STARTUP,
    property: "TimeToConsistentlyInteractive"
}

const benchStartupBootup: StartupBenchmarkResult = {
    id: "32_startup-bt",
    label: "脚本启动时间",
    description: "解析/编译/评估所有页面脚本所需要的总毫秒数",
    type: BenchmarkType.STARTUP,
    property: "ScriptBootUpTtime"
}

const benchStartupMainThreadWorkCost: StartupBenchmarkResult = {
    id: "33_startup-mainthreadcost",
    label: "主线程工作开销",
    description: "花费在完成主线程上的工作的总时间。包括style/layout等",
    type: BenchmarkType.STARTUP,
    property: "MainThreadWorkCost"
}

const benchStartupTotalBytes: StartupBenchmarkResult = {
    id: "34_startup-totalbytes",
    label: "总字节量",
    description: "所有资源加载到页面的网络传输成本 (压缩后)",
    type: BenchmarkType.STARTUP,
    property: "TotalKiloByteWeight"
}

class BenchStartup extends Benchmark {
    constructor() {
        super({
            id: "30_startup",
            label: "startup time",
            description: "Time for loading, parsing and starting up",
            type: BenchmarkType.STARTUP,
        })
    }
    async init(driver: WebDriver) { await driver.get(`http://localhost:${config.PORT}/`); }
    async run(driver: WebDriver, framework: FrameworkData) {
        await driver.get(`http://localhost:${config.PORT}/${framework.uri}/`);
        await testElementLocatedById(driver, "run", SHORT_TIMEOUT);
        return driver.sleep(config.STARTUP_SLEEP_DURATION);
    }
    extractResult(results: LighthouseData[], resultKind: BenchmarkInfo): number[] {
        return results.reduce((a, v) => { a.push(v[(resultKind as StartupBenchmarkResult).property]); return a; }, new Array<number>());
    }
    resultKinds() {
        return [
            benchStartupConsistentlyInteractive,
            benchStartupBootup,
            benchStartupMainThreadWorkCost,
            benchStartupTotalBytes,
        ];
    }
}
const benchStartup = new BenchStartup();

export let benchmarks : Array<Benchmark> = [
    benchRun,
    benchReplaceAll,
    benchUpdate,
    benchSelect,
    benchSwapRows,
    benchRemove,
    benchRunBig,
    benchAppendToManyRows,
    benchClear,
    benchReadyMemory,
    benchRunMemory,
    benchUpdate5Memory,
    benchReplace5Memory,
    benchCreateClear5Memory,
    benchStartup,
];

export function fileName(framework: FrameworkData, benchmark: BenchmarkInfo) {
    return `${framework.fullNameWithKeyedAndVersion}_${benchmark.id}.json`;
}