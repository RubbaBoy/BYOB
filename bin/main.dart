import 'dart:convert';
import 'dart:io';

Directory workingDir;

void main(List<String> args) {
  final name = args[0];
  final label = args[1];
  final status = args[2];
  final color = args[3];
  var path = args[4];
  final token = args[5];

  if (!path.startsWith('/')) {
    path = '/$path';
  }

  print('Make commit for badge:');
  print('name = $name');
  print('label = $label');
  print('status = $status');
  print('color = $color');
  print('\nLocation: $path');

  print('Files:');

  final env = Platform.environment;
  final remote =
      'https://${env['GITHUB_ACTOR']}:$token@github.com/${env['GITHUB_REPOSITORY']}.git';

  print('remote = $remote');

  runCommand('git', ['clone', remote, 'repo']);

  workingDir = Directory('${Directory.current.absolute.path}/repo');

  print('Exists ${workingDir.absolute.path}: ${workingDir.existsSync()}');

  final shields = workingDir.listSync().firstWhere(
      (entity) => entity.path.replaceFirst(workingDir.path, '') == path,
      orElse: () => File('${workingDir.path}$path')
        ..parent.createSync()
        ..createSync()) as File;

  print('Found file: ${shields.absolute.path}');

  print(
      'Absolute all:\n${workingDir.listSync().map((entity) => entity.absolute.path).join(', ')}');

  final contents = safeDecode(shields.readAsStringSync());

  contents[name] = {'label': label, 'status': status, 'color': color};

  shields.writeAsStringSync(jsonEncode(contents));

//  final remote = 'https://${env['GITHUB_ACTOR']}:$token@github.com/${env['GITHUB_REPOSITORY']}.git';

  runCommand('git', ['config', '--local', 'user.email', 'byob@yarr.is']);
  runCommand('git', ['config', '--local', 'user.name', 'BYOB']);
  runCommand(
      'git', ['add', '${shields.absolute.path.replaceFirst(workingDir.path, '')}']);
  runCommand('git', ['commit', '-m', 'Updating tag "$name"']);

  print('Pushing...');
  runCommand('git', ['push', remote, 'HEAD']);

  print('Goodbye!');
}

void runCommand(String cmd, List<String> args) {
  print('$cmd ${args.join(' ')}');
  final process = Process.runSync(cmd, args, workingDirectory: workingDir.absolute.path);
  print(process.stdout);
  print(process.stderr);
}

dynamic safeDecode(String json) {
  try {
    return jsonDecode(json);
  } catch (_) {
    return {};
  }
}
