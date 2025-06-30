```javascript
const zapier = require('zapier-platform-core');

const App = {
  version: require('./package.json').version,
  platformVersion: zapier.version,
  
  authentication: {
    type: 'custom',
    fields: [
      {key: 'api_key', type: 'string'}
    ],
    test: (z, bundle) => {
      const promise = z.request({
        url: 'https://api.github.com/user',
        params: {
          access_token: bundle.authData.api_key
        }
      });

      return promise.then((response) => {
        if (response.status === 401) {
          throw new Error('The API Key you supplied is invalid');
        }
        return response;
      });
    }
  },

  triggers: {
    new_commit: {
      noun: 'Commit',
      display: {
        label: 'New Commit',
        description: 'Triggers when a new commit is made.'
      },
      operation: {
        perform: (z, bundle) => {
          const promise = z.request({
            url: 'https://api.github.com/repos/{owner}/{repo}/commits',
            params: {
              access_token: bundle.authData.api_key
            }
          });
          return promise.then((response) => z.JSON.parse(response.content));
        }
      }
    }
  },

  actions: {
    run_tests: {
      noun: 'Test',
      display: {
        label: 'Run Tests',
        description: 'Runs tests on the new commit.'
      },
      operation: {
        perform: (z, bundle) => {
          const promise = z.request({
            method: 'POST',
            url: 'https://jenkins.example.com/job/test-suite/build',
            body: JSON.stringify({parameter: 'GIT_COMMIT', value: bundle.inputData.commit_id}),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${bundle.authData.api_key}`
            }
          });
          return promise.then((response) => z.JSON.parse(response.content));
        }
      }
    },

    send_slack_notification: {
      noun: 'Notification',
      display: {
        label: 'Send Slack Notification',
        description: 'Sends a notification to Slack with the test results.'
      },
      operation: {
        perform: (z, bundle) => {
          const promise = z.request({
            method: 'POST',
            url: 'https://slack.com/api/chat.postMessage',
            body: JSON.stringify({channel: '#dev-team', text: `Test suite completed for commit ${bundle.inputData.commit_id}. Results: ${bundle.inputData.result}`}),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${bundle.authData.api_key}`
            }
          });
          return promise.then((response) => z.JSON.parse(response.content));
        }
      }
    },

    deploy_to_staging: {
      noun: 'Deployment',
      display: {
        label: 'Deploy to Staging',
        description: 'Deploys the application to the staging environment if all tests pass.'
      },
      operation: {
        perform: (z, bundle) => {
          const promise = z.request({
            method: 'POST',
            url: 'https://api.aws.com/deploy',
            body: JSON.stringify({environment: 'staging', commit_id: bundle.inputData.commit_id}),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${bundle.authData.api_key}`
            }
          });
          return promise.then((response) => z.JSON.parse(response.content));
        }
      }
    },

    send_email_notification: {
      noun: 'Email',
      display: {
        label: 'Send Email Notification',
        description: 'Sends an email notification to the team.'
      },
      operation: {
        perform: (z, bundle) => {
          const promise = z.request({
            method: 'POST',
            url: 'https://api.sendgrid.com/v3/mail/send',
            body: JSON.stringify({
              personalizations: [{
                to: [{email: 'team@example.com'}],
                subject: `Deployment Successful for Commit ${bundle.inputData.commit_id}`,
                content: [{type: 'text/plain', value: `The application has been successfully deployed to staging for commit ${bundle.inputData.commit_id}.`}]
              }]
            }),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${bundle.authData.api_key}`
            }
          });
          return promise.then((response) => z.JSON.parse(response.content));
        }
      }
    }
  }
};

module.exports = App;
```