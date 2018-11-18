const shell = require('shelljs');

/**
 * This is the entry point for your Probot App.
 * @param {import('probot').Application} app - Probot's Application class.
 */
module.exports = app => {

  app.on(['pull_request.opened','pull_request.reopened'], async context => {
    const branch_from = context.payload.pull_request.head.ref;
    const branch_target = context.payload.pull_request.base.ref;
    const branch_from_clone_url = context.payload.pull_request.head.repo.clone_url;
    const branch_target_clone_url = context.payload.pull_request.base.repo.clone_url;
    shell.mkdir('from');
    shell.cd('from');
    let comment = 'BUG REPORT:\n';
    if (shell.exec(`git clone ${branch_from_clone_url}`).code) {
      shell.echo('Error: Git clone failed!');
    } else {
      if (shell.exec(`git checkout -f ${branch_from}`).code) {
        const list = shell.find('.').filter((file) =>  file.match(/\.c$/));
        console.log(list);
        list.forEach(function(file) {
          const output = shell.exec('clang-check -analyze -extra-arg -Xclang -extra-arg -analyzer-output=text ' + file + ' --', {silent:true}).stderr;
          if (typeof output !== 'undefined') {
            comment += output;
          }
          console.log(output);
        });
      } else {
        shell.echo('Error: Git checkout failed!');
      }
    }
    shell.cd('..');
    shell.rm('-rf', 'from');
    console.log(comment);
    const issueComment = context.issue({ body: comment });
    return context.github.issues.createComment(issueComment);
  });

  app.on('issues.opened', async context => {
    console.log("hi");
  });

  // app.on('pull_request.opened', async context => {
  //   app.log('pull request opened');
  //   app.log(context);
  //   console.log(context.payload);
  //   const branch_from = context.payload.pull_request.head.ref;
  //   const branch_target = context.payload.pull_request.base.ref;
  //   const branch_from_clone_url = context.payload.pull_request.head.repo.clone_url;
  //   const branch_target_clone_url = context.payload.pull_request.base.repo.clone_url;
  //   const pullRequestComment = context.issue({ body: 'Thanks for opening this pull request!' });
  //   return context.github.issues.createComment(pullRequestComment);
  // });

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}
