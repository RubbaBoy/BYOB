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
  final branch = args[6];

  if (!path.startsWith('/')) {
    path = '/$path';
  }

  final env = Platform.environment;
  final remote =
      'https://${env['GITHUB_ACTOR']}:$token@github.com/${env['GITHUB_REPOSITORY']}.git';

  final cloneInto = 'repo-${DateTime.now().millisecondsSinceEpoch}';

  workingDir = Directory('${Directory.current.absolute.path}/$cloneInto');

  cloneRepo(branch, remote, cloneInto);

  final shields = workingDir.listSync().firstWhere(
      (entity) => entity.path.replaceFirst(workingDir.path, '') == path,
      orElse: () => File('${workingDir.path}$path')
        ..parent.createSync()
        ..createSync()) as File;

  final contents = safeDecode(shields.readAsStringSync());

  contents[name] = {'label': label, 'status': status, 'color': color};

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

  print('Done with repo stuff');
}

String runCommand(String cmd,
    [List<String> args = const [], bool includeWorkingDir = true]) {
  print('$cmd ${args.join(' ')}');
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
