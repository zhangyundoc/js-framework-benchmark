import * as _ from 'lodash'
import * as fs from 'fs';
import {JSONResult, config, FrameworkData, initializeFrameworks} from './common'
import {BenchmarkType, Benchmark, benchmarks, fileName, BenchmarkInfo} from './benchmarks'
import * as yargs from 'yargs';

let frameworks = initializeFrameworks();

let results: Map<string, Map<string, JSONResult>> = new Map();

let resultJS = "import {RawResult} from './Common';\n\nexport let results: RawResult[]=[";

let allBenchmarks : BenchmarkInfo[] = [];

benchmarks.forEach((benchmark, bIdx) => {
    let r = benchmark.resultKinds ? benchmark.resultKinds() : [benchmark];
    r.forEach((benchmarkInfo) => {
        allBenchmarks.push(benchmarkInfo);
    });
});

frameworks.forEach((framework, fIdx) => {
    allBenchmarks.forEach((benchmarkInfo) => {
        let name = `${fileName(framework, benchmarkInfo)}`;
        let file = './results/' + name;
        if (fs.existsSync(file)) {
            let data : JSONResult = JSON.parse(fs.readFileSync(file, {
                encoding:'utf-8'
            }));
            resultJS += '\n' + JSON.stringify(({f:data.framework, b:data.benchmark, v:data.values})) + ',';
        } else {
            console.log("MISSING FILE",file);
        }
    });
});



resultJS += '];\n';
resultJS += 'export let frameworks = '+JSON.stringify(frameworks.map(f => ({name: f.fullNameWithKeyedAndVersion, keyed: f.keyed})))+";\n";
resultJS += 'export let benchmarks = '+JSON.stringify(allBenchmarks)+";\n";

fs.writeFileSync('../webdriver-ts-results/src/results.ts', resultJS, {encoding: 'utf-8'});

