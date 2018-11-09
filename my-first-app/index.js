const shell = require('shelljs');

/**
 * This is the entry point for your Probot App.
 * @param {import('probot').Application} app - Probot's Application class.
 */
module.exports = app => {
  // Your code here
  app.log('Yay, the app was loaded!');

  console.log('oh boi');

  app.on('issues.opened', async context => {
    app.log('issue opened');
    var repo_url = context.payload.repository.html_url;
    var repo_name = context.payload.repository.name;
    shell.mkdir('temp');
    shell.cd('temp');
    if (shell.exec('git clone ' + repo_url).code !== 0) {
      shell.echo('Error: Git clone failed!');
    } else {
      shell.echo('Woa dude it worked');
      // TODO: change regex to include .h, .cpp, etc.
      var list = shell.find('.').filter(function(file) { return file.match(/\.c$/); });
      console.log(list);
      var comment = 'BUG REPORT:\n';
      list.forEach(function(file) {
        var output = shell.exec('clang-check -analyze -extra-arg -Xclang -extra-arg -analyzer-output=text ' + file + ' --', {silent:true}).stderr;
        if (typeof output !== 'undefined') {
          comment += output;
        }
        console.log(output);
        // console.log(shell.exec('clang-check -analyze ' + file + ' --').output);
      });
    }
    shell.cd('..');
    shell.rm('-rf', 'temp');
    // var list = shell.find('.').filter(function(file) { return file.match(/\.txt$/); });
    // console.log(repo_url);
    console.log(comment);
    const issueComment = context.issue({ body: comment });
    return context.github.issues.createComment(issueComment);
  });

  app.on('pull_request.opened', async context => {
    app.log('pull request opened');
    app.log(context);
    console.log(context.payload);
    const branch = context.payload.pull_request.head.ref;
    const clone_url = context.payload.repository.clone_url;
    const pullRequestComment = context.issue({ body: 'Thanks for opening this pull request!' });
    return context.github.issues.createComment(pullRequestComment);
  });

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}
