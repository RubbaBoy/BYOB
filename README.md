# Bring Your Own Badge

BYOB is a GitHub Action to create badges dynamically based off of GitHub Actions' results, allowing for extremely versatile and easily-maintainable badges.

Current solutions allow for simple statuses based off of Actions' results, however with BYOB, you can have as many badges updated as wanted, with every part of the badge changeable by code in the Action.

## Usage

### Example Workflow file

A simple workflow file updating a badge on the current time is shown below.

```yaml
jobs:
  badge_job:
    runs-on: ubuntu-latest
    steps:
      - id: date
        run: echo "##[set-output name=data;]$(date)"
      - name: Time badge
        uses: RubbaBoy/BYOB@v1.2.1
        with:
          NAME: time
          LABEL: 'Updated at'
          STATUS: ${{ steps.date.outputs.data }}
          COLOR: 00EEFF
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Using this badge (Named `time`) in the repository `RubbaBoy/Example` is as simple as:

```markdown
![](https://byob.yarr.is/RubbaBoy/Example/time)
```

This badge looks like:

![](https://byob.yarr.is/RubbaBoy/BYOBTest/time)

### Example Icon Workflows

The following are some more example workflows using icons. They may either be an icon name from [badgen](https://badgen.net/), or a URL to an SVG. Only the `with` portion is shown, for simplicity.

#### Icon With Label

```yaml
NAME: github
LABEL: 'GitHub'
ICON: 'github'
STATUS: 'BYOBTest'
COLOR: blue
GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

![](https://byob.yarr.is/RubbaBoy/BYOBTest/github)

#### Icon Without Label

```yaml
NAME: git
ICON: 'git'
STATUS: 'Git'
COLOR: red
GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

![](https://byob.yarr.is/RubbaBoy/BYOBTest/git)

#### Custom Icon

```yaml
NAME: custom
ICON: 'https://simpleicons.now.sh/counter-strike/e43'
STATUS: 'Custom Icons'
COLOR: red
GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

![](https://byob.yarr.is/RubbaBoy/BYOBTest/custom)


Other URL schemes are supported as well. The general scheme after `https://byob.yarr.is/` is:

```
/nameOrOrg/repo/badgeName/branch/path/to/shields.json
```

Only up to `branch` is required. The following are examples of more advanced badge URLs.

#### Basic off-master badge

Badges may be used off of the default orphan `shields` branch. For example, on the `dev` branch:

```markdown
![](https://byob.yarr.is/RubbaBoy/Example/time/dev)
```

#### Custom Path

Badges may also use custom JSON paths, allowing for multiple files per project for whatever your usecase may be. The branch must be included in this URL. The following shows a path to `/child/dir/badges.json`

```markdown
![](https://byob.yarr.is/RubbaBoy/Example/time/shields/child/dir/badges.json)
```

An example of a repo with multiple badges may be found here: [BYOBTest](https://github.com/RubbaBoy/BYOBTest)

### Private repos or alternative repos
It is now possible to host the generated json file in an alternate public repo. Which would allow you to have an action that runs on a private repo to host the badge metadata in a public repo

**The general steps are as follows:**
* Login to GitHub and create a Personal Access Token. (Select repo scope) and copy generated secret
* Go to the private repo where the action runs. Settings > Secrets > New repository secret
* Name your secret according to how you want to reference it within the BYOB workflow step. i.e `${{ ACTIONS_TOKEN }}` so you can reference them like `${{ secrets.ACTIONS_TOKEN }}`
* Define the two optional inputs `repository` and `actor` where repository is in the form `nameOrg/repoName` and the actor is the user who created the personal access token. 
* Finally, follow the steps above to obtain your URL but replace the `orgName/repo` part with your public repo

#### Example

```yaml
NAME: github
LABEL: 'GitHub'
ICON: 'github'
STATUS: 'BYOBTest'
COLOR: blue
GITHUB_TOKEN: ${{ secrets.ACTIONS_TOKEN }}
REPOSITORY: RubbaBoy/BYOBTest
ACTOR: RubbaBoy
```

### Inputs

| **Name**     | **Required** | **Default**     | **Description**                                              |
| ------------ | ----- | --------------- | ------------------------------------------------------------ |
| name         | yes |                 | The alphanumeric (-_ included) name of the badge, 32 chars or less. Used only for identification purposes. |
| label        | yes |                 | The left label of the badge, usually static.                 |
| icon         | yes |                 | An icon name from [badgen](https://badgen.net/), or an SVG URL |
| status       | yes |                 | The right status as the badge, usually based on results.     |
| color        | yes |                 | The hex color of the badge.                                  |
| github_token | yes |                 | The GitHub token to push to the current repo. Suggested as `${{ secrets.GITHUB_TOKEN }}` |
| path         | no  | `/shields.json` | The absolute file path to store the JSON data to.            |
| branch       | no  | `shields`       | The branch to contain the shields file.                      |
| repository   | no  |                 | Allows to publish json to an alternate repo. Useful to host the json in a public repo and have the action in a private repo.                      |
| actor        | no  |                 | Required if repository is specified to use along with custom GitHub Access token                      |

## How It Works

BYOB is very simple, consisting of the GitHub Action and a small server-side script. The Action updates a json file containing all badge info. This is by default the `shields` branch as to keep the commit history clean on working branches. Each badge has a name associated with it only used for identification purposes, and is not displayed.

When the Action is invoked, it will update only the badge names that have changed, to allow for more persistent data. Whenever a badge is invoked, a push is made to the repo updating the file. No badge data is stored server-side.

The actual badges hosted by [Badgen](https://badgen.net/) (A great service, check it out if you have a chance!). The hosted endpoint uses the code [here](https://github.com/RubbaBoy/BYOB/blob/master/index.js). It reads the given repositories' JSON file containing shields data in it, and returns a Badgen-generated badge. This uses the static Badgen `/badge`  endpoint to allow for much less caching, as paired with GitHub's aggressive caching it can be extremely slow.
