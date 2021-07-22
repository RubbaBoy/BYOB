import 'dart:convert';
import 'dart:io';

Map<String, String> get env => Platform.environment;

Directory workingDir;

void main(List<String> args) {
  final name = args[0];
  final label = args[1];
  final icon = args[2];
  final status = args[3];
  final color = args[4];
  var path = args[5];
  final token = args[6];
  final branch = args[7];
  var repository = args[8];

  if (!path.startsWith('/')) {
    path = '/$path';
  }
  if (repository.isEmpty) {
    repository = env['GITHUB_REPOSITORY'].toString();
  }

  final remote =
      'https://${env['GITHUB_ACTOR']}:$token@github.com/$repository.git';

  final cloneInto = 'repo-${DateTime.now().millisecondsSinceEpoch}';

  workingDir = Directory('${Directory.current.absolute.path}/$cloneInto');

  cloneRepo(branch, remote, cloneInto);

  final shields = workingDir.listSync().firstWhere(
      (entity) => entity.path.replaceFirst(workingDir.path, '') == path,
      orElse: () => File('${workingDir.path}$path')
        ..parent.createSync()
        ..createSync()) as File;

  final contents = safeDecode(shields.readAsStringSync());

  contents[name] = {
    if (label.isNotEmpty) 'label': label,
    if (icon.isNotEmpty) 'icon': icon,
    'status': status,
    'color': color
  };

  shields.writeAsStringSync(jsonEncode(contents));

  runCommand('git', ['config', '--local', 'user.email', 'byob@yarr.is']);
  runCommand('git', ['config', '--local', 'user.name', 'BYOB']);
  runCommand('git', ['add', '.']);
  runCommand('git', ['commit', '-m', 'Updating tag "$name"']);
  runCommand('git', ['push', remote, 'HEAD']);
  runCommand('rm', ['-rf', workingDir.absolute.path], false);
}

void cloneRepo(String branch, String remote, String cloneInto) {
  runCommand('git', ['clone', remote, cloneInto], false);

  final branches = runCommand('git', ['branch', '-a'])
      .split('\n')
      .where((line) => line.length >= 2)
      .map((line) => line.substring(2).replaceFirst('remotes/origin/', ''))
      .toList();
  if (branches.contains(branch)) {
    runCommand('git', ['checkout', branch]);
  } else {
    runCommand('git', ['checkout', '--orphan', branch]);
    runCommand('git', ['rm', '-rf', '.']);
  }
}

String runCommand(String cmd,
    [List<String> args = const [], bool includeWorkingDir = true]) {
  final process = includeWorkingDir
      ? Process.runSync(cmd, args, workingDirectory: workingDir.absolute.path)
      : Process.runSync(cmd, args);
  print(process.stderr);
  return process.stdout;
}

dynamic safeDecode(String json) {
  try {
    return jsonDecode(json);
  } catch (_) {
    return {};
  }
}
