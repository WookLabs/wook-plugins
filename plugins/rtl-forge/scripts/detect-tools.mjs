#!/usr/bin/env node

/**
 * RTL Tool Detection Script
 * Detects available lint, simulation, and analysis tools
 * Outputs: .omc/rtl-forge/tool-config.json
 */

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

function detectTool(name, command) {
  try {
    const result = execSync(command, { encoding: 'utf-8', timeout: 5000, stdio: ['pipe', 'pipe', 'pipe'] });
    return { available: true, path: result.trim().split('\n')[0] };
  } catch {
    return { available: false, path: null };
  }
}

function detectVersion(command) {
  try {
    const result = execSync(command, { encoding: 'utf-8', timeout: 5000, stdio: ['pipe', 'pipe', 'pipe'] });
    const match = result.match(/(\d+\.\d+[\.\d]*)/);
    return match ? match[1] : 'unknown';
  } catch {
    return null;
  }
}

function main() {
  const tools = {
    lint: {},
    simulation: {},
    analysis: {},
    formatting: {}
  };

  // Lint tools
  const verilator = detectTool('verilator', process.platform === 'win32' ? 'where verilator' : 'which verilator');
  if (verilator.available) {
    tools.lint.verilator = {
      available: true,
      path: verilator.path,
      version: detectVersion('verilator --version'),
      command: 'verilator --lint-only -Wall'
    };
  }

  const slang = detectTool('slang', process.platform === 'win32' ? 'where slang' : 'which slang');
  if (slang.available) {
    tools.lint.slang = {
      available: true,
      path: slang.path,
      version: detectVersion('slang --version'),
      command: 'slang --lint-only'
    };
  }

  const verible = detectTool('verible', process.platform === 'win32' ? 'where verible-verilog-lint' : 'which verible-verilog-lint');
  if (verible.available) {
    tools.lint.verible = {
      available: true,
      path: verible.path,
      version: detectVersion('verible-verilog-lint --version'),
      command: 'verible-verilog-lint'
    };
  }

  // Simulation tools
  const questa = detectTool('questa', process.platform === 'win32' ? 'where vsim' : 'which vsim');
  if (questa.available) {
    tools.simulation.questa = {
      available: true,
      path: questa.path,
      compile: 'vlog -sv -work work',
      simulate: 'vsim -c work.{tb} -do "run -all; quit"',
      coverage: 'vsim -c -coverage work.{tb} -do "run -all; coverage report; quit"'
    };
  }

  const vcs = detectTool('vcs', process.platform === 'win32' ? 'where vcs' : 'which vcs');
  if (vcs.available) {
    tools.simulation.vcs = {
      available: true,
      path: vcs.path,
      compile: 'vcs -sverilog -full64 -debug_access+all',
      simulate: './simv',
      coverage: 'vcs -sverilog -full64 -cm line+cond+fsm+tgl+branch'
    };
  }

  const xcelium = detectTool('xcelium', process.platform === 'win32' ? 'where xrun' : 'which xrun');
  if (xcelium.available) {
    tools.simulation.xcelium = {
      available: true,
      path: xcelium.path,
      compile_and_run: 'xrun -sv',
      coverage: 'xrun -sv -coverage all -covoverwrite'
    };
  }

  // Analysis tools
  if (slang.available) {
    tools.analysis.slang = {
      available: true,
      symbols: 'slang --dump-symbols',
      hierarchy: 'slang --dump-hierarchy',
      ast_json: 'slang --ast-json'
    };
  }

  // Formatting
  if (verible.available) {
    tools.formatting.verible = {
      available: true,
      command: 'verible-verilog-format'
    };
  }

  // Determine preferred tools
  const preferred = {
    lint: tools.lint.verilator ? 'verilator' : (tools.lint.slang ? 'slang' : null),
    simulation: tools.simulation.questa ? 'questa' : (tools.simulation.vcs ? 'vcs' : (tools.simulation.xcelium ? 'xcelium' : null)),
    analysis: tools.analysis.slang ? 'slang' : null,
    formatting: tools.formatting.verible ? 'verible' : null
  };

  const config = {
    generated_at: new Date().toISOString(),
    preferred,
    tools
  };

  // Write config
  const configDir = join(process.cwd(), '.omc', 'rtl-forge');
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }

  const configPath = join(configDir, 'tool-config.json');
  writeFileSync(configPath, JSON.stringify(config, null, 2));

  // Summary output
  const lintTools = Object.keys(tools.lint).filter(k => tools.lint[k].available);
  const simTools = Object.keys(tools.simulation).filter(k => tools.simulation[k].available);

  console.log('RTL Tool Detection Complete');
  console.log('==========================');
  console.log(`Lint tools:       ${lintTools.length > 0 ? lintTools.join(', ') : 'NONE'}`);
  console.log(`Simulators:       ${simTools.length > 0 ? simTools.join(', ') : 'NONE'}`);
  console.log(`Analysis:         ${tools.analysis.slang ? 'slang' : 'NONE'}`);
  console.log(`Formatting:       ${tools.formatting.verible ? 'verible' : 'NONE'}`);
  console.log(`Preferred lint:   ${preferred.lint || 'NONE'}`);
  console.log(`Preferred sim:    ${preferred.simulation || 'NONE'}`);
  console.log(`Config written:   ${configPath}`);

  if (lintTools.length === 0) {
    console.log('\n⚠️  No lint tools found. Install verilator or slang for automatic lint.');
    console.log('   - Verilator: https://verilator.org');
    console.log('   - Slang: https://github.com/MikePopoloski/slang');
  }
}

main();
