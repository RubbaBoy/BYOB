import 'dart:convert';
import 'dart:io';

bool startupTasks = true;
Directory _workingDir;

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

  _workingDir = Directory('/github/repo');

  cloneRepo(branch, remote);

  final shields = _workingDir.listSync().firstWhere(
      (entity) => entity.path.replaceFirst(_workingDir.path, '') == path,
      orElse: () => File('${_workingDir.path}$path')
        ..parent.createSync()
        ..createSync()) as File;

  final contents = safeDecode(shields.readAsStringSync());

  contents[name] = {'label': label, 'status': status, 'color': color};

  shields.writeAsStringSync(jsonEncode(contents));

  if (startupTasks) {
    runCommand('git', ['config', '--local', 'user.email', 'byob@yarr.is']);
    runCommand('git', ['config', '--local', 'user.name', 'BYOB']);
  }

  runCommand('git', ['add', '.']);
  runCommand('git', ['commit', '-m', 'Updating tag "$name"']);
  runCommand('git', ['push', remote, 'HEAD']);
}

void cloneRepo(String branch, String remote) {
  if (_workingDir.existsSync()) {
    print('/github/repo exists! Don\'t clone');
    startupTasks = false;
  } else {
    print('Clone! It doesn\'t exist');

    print(runCommand('git', ['clone', remote, 'repo'], Directory('/github')));

    final branchesCommand = runCommand('git', ['branch', '-a']);
    final branches = branchesCommand.split('\n').where((line) =>
    line.length >= 2)
        .map((line) => line.substring(2).replaceFirst('remotes/origin/', ''))
        .toList();
    print('branches = $branches');
    if (branches.contains(branch)) {
      print('Branch "$branch" exists! Checking out...');
      print(runCommand('git', ['checkout', branch]));
    } else {
      print('Branch "$branch" not existant! Creating orphan...');
      print(runCommand('git', ['checkout', '--orphan', branch]));
      print(runCommand('git', ['rm', '-rf', '.']));
    }
  }

  print('Done with repo stuff');
}

String runCommand(String cmd, List<String> args,
    [Directory workingDir]) {
  print('$cmd ${args.join(' ')}');
  final process = Process.runSync(cmd, args, workingDirectory: (workingDir ?? _workingDir).absolute.path);
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
