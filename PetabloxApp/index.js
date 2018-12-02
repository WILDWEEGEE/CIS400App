const shell = require('shelljs');
const jsonwebtoken = require('jsonwebtoken');
const home_dir = shell.pwd().stdout;
const appId = 20461;

const fs = require('fs');
let privateKey = 'temp';
fs.readFile('../../PrivateKeys/petablox.2018-12-01.private-key.pem', 'utf8', function(err, data) {  
    if (err) throw err;
    privateKey = data;
}); 

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
        if (shell.exec(`python ${parser} ${target_analysis} ${from_analysis} ${diff_dir}`).code) {
            console.log('Error: Parser failed!');
        } else {
            console.log('Parser succeeded!');
        }
    }

    function createComments(context, home_dir, diff_dir) {
        shell.cd(home_dir);
        let comments = []
        const htmlParser = 'parser/ReportHTMLParser.py';
        shell.ls(`${diff_dir}/*.html`).forEach(function (file) {
            htmlParserCmd = shell.exec(`python ${htmlParser} ${file}`, {silent:true});
            if (htmlParserCmd.code) {
                console.log(`Error: Could not parse html for ${file}`);
            } else {
                parsedHtml = htmlParserCmd.stdout;
                const comment = context.issue({ body: parsedHtml });
                comments.push(comment);
            }
        });
        return comments;
    }

    function cleanup(home_dir, from_dir, target_dir, diff_dir) {
        shell.cd(home_dir);
        shell.rm('-rf', from_dir);
        shell.rm('-rf', target_dir);
        shell.rm('-rf', diff_dir);
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
        console.log('creating comments');
        const comments = createComments(context, home_dir, diff_dir);
        comments.forEach(function (comment) {
            context.github.issues.createComment(comment);
        });
        console.log('starting cleanup');
        cleanup(home_dir, from_dir, target_dir, diff_dir);

        // TODO
        // const prepared_from_comment = context.issue({ body: from_output });
        // const prepared_target_comment = context.issue({ body: target_output });
        // const prepared_from_comment = context.issue({ body: runClangCheck('from', branch_from_clone_url, branch_from) });
        // const prepared_target_comment = context.issue({ body: runClangCheck('target', branch_target_clone_url, branch_target) });
        // await context.github.issues.createComment(prepared_from_comment);
        // return context.github.issues.createComment(prepared_target_comment);
    });

    app.on('issues.opened', async context => {
        console.log("hi");

        const now = Math.floor(Date.now() / 1000);
        const payload = {
            iat: now,
            exp: now + 60,
            iss: appId
        };
        const bearer = jsonwebtoken.sign(payload, privateKey, {algorithm: 'RS256'});
        console.log(bearer);

        context.github.authenticate({ type: 'app', token: bearer });

        const install_id = context.payload.installation.id;
        const {data: {token}} = await context.github.apps.createInstallationToken({installation_id: install_id});

        context.github.authenticate({ type: 'token', token });

        console.log(token);

        const fullName = context.payload.repository.full_name;
        shell.exec(`git clone https://x-access-token:${token}@github.com/${fullName}.git`);

        // const rubyCmd = shell.exec('ruby ruby/generate_jwt.rb', {silent:true});
        // if (rubyCmd.code) {
        //     error = 'Error: Could not generate JWT!';
        //     console.log(error);
        // } else {
        //     const jwt = rubyCmd.stdout;
        //     console.log(jwt);
        // }

        // const install_id = context.payload.installation.id;
        // console.log(context.github.apps.createInstallationToken({installation_id: install_id}));

        // console.log(context.payload.installation.id);

        // console.log(context.github.authenticate({ type: 'app', token: 'superspecialsecret' }));
        // console.log(context.github.apps.listInstallations());
        // console.log(octokit.apps.getAuthenticated());

        // console.log(home_dir);
        // const issueComment = context.issue({ body: 'Thanks for opening this issue!' });
        // return context.github.issues.createComment(issueComment);
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
