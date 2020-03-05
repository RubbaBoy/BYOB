import 'dart:convert';
import 'dart:io';

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

  final dir = Directory.current.absolute;
  print('Absolute: ${dir.path}');

  final shields = dir.listSync().firstWhere(
      (entity) => entity.path.replaceFirst(dir.path, '') == path,
      orElse: () =>
          File('${dir.path}$path')..parent.createSync()..createSync()) as File;

  print('Found file: ${shields.absolute.path}');

  print(
      'Absolute all:\n${dir.listSync().map((entity) => entity.absolute.path).join(', ')}');

  final env = Platform.environment;
  print(env);
  print(env['GITHUB_ACTOR']);
  print(env['REPOSITORY']);

  final contents = safeDecode(shields.readAsStringSync());

  contents[name] = {
    'label': label,
    'status': status,
    'color': color
  };

  final remote = 'https://$token@github.com/${env['GITHUB_REPOSITORY']}.git';

  print('remote = $remote');

  Process.runSync('git', ['config', '--local', 'user.email', 'byob@yarr.is'], runInShell: true);
  Process.runSync('git', ['config', '--local', 'user.name', 'BYOB'], runInShell: true);
  Process.runSync('git', ['commit', '-m', 'Updating tag "$name"', '-a'], runInShell: true);

  print('out:');
  final pushData = Process.runSync('git', ['push', remote, 'HEAD'], runInShell: true);
  print(pushData.stdout);
  print(pushData.stderr);

  shields.writeAsStringSync(jsonEncode(contents));

  print('Goodbye!');
}

dynamic safeDecode(String json) {
  try {
    return jsonDecode(json);
  } catch (_) {
    return {};
  }
}
