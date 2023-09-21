#!/usr/bin/env node

import { program } from 'commander'

import { PKG } from './constants.js'

import { listFn, useFn, currentFn, testFn, addFn, deleteFn } from './actions.js'

program.version(PKG.version)

program
  .command('ls')
  .description('查看镜像')
  .action(listFn)

program
  .command('use')
  .description('请选择镜像')
  .action(useFn)

program
  .command('current')
  .description('查看当前源')
  .action(currentFn)

program
  .command('test [registry]')
  .description('测试镜像地址速度')
  .action(testFn)

program
  .command('add')
  .description('自定义镜像')
  .action(addFn)

program
  .command('delete')
  .description('删除自定义的源')
  .action(deleteFn)

program
  .parse(process.argv)
