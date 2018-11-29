const shell = require('shelljs');
const home_dir = shell.pwd().stdout;

/**
 * This is the entry point for your Probot App.
 * @param {import('probot').Application} app - Probot's Application class.
 */
module.exports = app => {

    function runScanBuild(home_dir, directory, clone_url, branch) {
        shell.cd(home_dir);
        shell.mkdir(directory);
        shell.cd(directory);
        if (shell.exec(`git clone -b ${branch} ${clone_url}`).code) {
            let errorMsg = `Error: Git clone for ${directory} directory failed!`;
            console.log(errorMsg);
            return errorMsg;
        } else {
            // TODO: search for Makefile in root directory
            shell.cd('*');
            let comment = `${directory} directory BUG REPORT:\n`;
            const scanBuildCmd = shell.exec('scan-build -o ../analysis make', {silent:true});
            if (scanBuildCmd.code) {
                comment = `Error: scan-build for ${directory} directory failed!`;
                console.log(comment);
            } else {
                const output = scanBuildCmd.stderr
                if (typeof output !== 'undefined') {
                    comment += output;
                }
                console.log(output);
            }
            return comment;
        }
    }

    function runClangCheck(directory, clone_url, branch) {
        shell.mkdir(directory);
        shell.cd(directory);
        let comment = 'BUG REPORT:\n';
        if (shell.exec(`git clone -b ${branch} ${clone_url}`).code) {
            shell.echo('Error: Git clone failed!');
        } else {
            const list = shell.find('.').filter((file) =>  file.match(/\.c$/));
            console.log(list);
            list.forEach(function(file) {
                const output = shell.exec('clang-check -analyze -extra-arg -Xclang -extra-arg -analyzer-output=text ' + file + ' --', {silent:true}).stderr;
                if (typeof output !== 'undefined') {
                    comment += output;
                }
                console.log(output);
            });
        }
        shell.cd('..');
        // shell.rm('-rf', directory);
        return comment;
    }

    function runParser(home_dir, parser, from_dir, target_dir, diff_dir) {
        shell.cd(home_dir);
        const from_analysis = `${from_dir}/analysis/*`;
        const target_analysis = `${target_dir}/analysis/*`;
        if (shell.exec(`python ${parser} ${from_analysis} ${target_analysis} ${diff_dir}`).code) {
            console.log('Error: Parser failed!');
        } else {
            console.log('Parser succeeded!');
        }
    }

    function cleanup(home_dir, from_dir, target_dir, diff_dir) {
        shell.cd(home_dir);
        shell.rm('-rf', from_dir);
        shell.rm('-rf', target_dir);
    }

    app.on(['pull_request.opened','pull_request.reopened'], async context => {
        const from_dir = 'from';
        const target_dir = 'target';
        const diff_dir = 'diff';
        const parser = 'parser/ScanBuildDifferencer.py';

        const branch_from = context.payload.pull_request.head.ref;
        const branch_target = context.payload.pull_request.base.ref;
        const branch_from_clone_url = context.payload.pull_request.head.repo.clone_url;
        const branch_target_clone_url = context.payload.pull_request.base.repo.clone_url;

        console.log('starting from');
        const from_output = runScanBuild(home_dir, from_dir, branch_from_clone_url, branch_from);
        console.log('starting target');
        const target_output = runScanBuild(home_dir, target_dir, branch_target_clone_url, branch_target);
        console.log('running parser');
        runParser(home_dir, parser, from_dir, target_dir, diff_dir);
        console.log('starting cleanup');
        cleanup(home_dir, from_dir, target_dir);

        // TODO
        const prepared_from_comment = context.issue({ body: from_output });
        const prepared_target_comment = context.issue({ body: target_output });
        // const prepared_from_comment = context.issue({ body: runClangCheck('from', branch_from_clone_url, branch_from) });
        // const prepared_target_comment = context.issue({ body: runClangCheck('target', branch_target_clone_url, branch_target) });
        await context.github.issues.createComment(prepared_from_comment);
        return context.github.issues.createComment(prepared_target_comment);
    });

    app.on('issues.opened', async context => {
        console.log("hi");
        console.log(home_dir);
        const issueComment = context.issue({ body: 'Thanks for opening this issue!' });
        return context.github.issues.createComment(issueComment);
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
