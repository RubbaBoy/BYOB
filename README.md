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

#### Custom Icon URL

```yaml
NAME: custom
ICON: 'https://raw.githubusercontent.com/RubbaBoy/BYOBTest/master/icons/dollar.svg'
STATUS: 'Custom Icons'
COLOR: red
GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

It should be noted that icons pointing to external URLs are cached for 1 day. The resulting icon is:

![](https://byob.yarr.is/RubbaBoy/BYOBTest/custom)

#### Custom Icon Inline SVG

```yaml
NAME: custom
ICON: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMjRweCIgdmlld0JveD0iMCAwIDI0IDI0IiB3aWR0aD0iMjRweCIgZmlsbD0iI0YwMCI+PHBhdGggZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0xMiAyMS4zNWwtMS40NS0xLjMyQzUuNCAxNS4zNiAyIDEyLjI4IDIgOC41IDIgNS40MiA0LjQyIDMgNy41IDNjMS43NCAwIDMuNDEuODEgNC41IDIuMDlDMTMuMDkgMy44MSAxNC43NiAzIDE2LjUgMyAxOS41OCAzIDIyIDUuNDIgMjIgOC41YzAgMy43OC0zLjQgNi44Ni04LjU1IDExLjU0TDEyIDIxLjM1eiIvPjwvc3ZnPg=='
STATUS: 'Custom Icons'
COLOR: blue
GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

The above `ICON` value is a Base64 encoded representation of a colored SVG [Material Icon](https://fonts.google.com/icons?selected=Material+Icons). This provides for great flexibility, with the benefit of keeping it local. The resulting icon is:

![](https://byob.yarr.is/RubbaBoy/BYOBTest/custom_inline)

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
| ------------ | ------------ | --------------- | ------------------------------------------------------------ |
| name         | yes          |                 | The alphanumeric (-_ included) name of the badge, 32 chars or less. Used only for identification purposes. |
| label        | yes          |                 | The left label of the badge, usually static.                 |
| icon         | yes          |                 | An icon name from [badgen](https://badgen.net/), an SVG URL, or a Base64 Encoded representation of an SVG |
| status       | yes          |                 | The right status as the badge, usually based on results.     |
| color        | yes          |                 | The hex color of the badge.                                  |
| github_token | yes          |                 | The GitHub token to push to the current repo. Suggested as `${{ secrets.GITHUB_TOKEN }}` |
| path         | no           | `/shields.json` | The absolute file path to store the JSON data to.            |
| branch       | no           | `shields`       | The branch to contain the shields file.                      |
| repository   | no           |                 | Allows to publish json to an alternate repo. Useful to host the json in a public repo and have the action in a private repo. |
| actor        | no           |                 | Required if repository is specified to use along with custom GitHub Access token |

## How It Works

BYOB is very simple, consisting of the GitHub Action and a small server-side script. The Action updates a json file containing all badge info. This is by default the `shields` branch as to keep the commit history clean on working branches. Each badge has a name associated with it only used for identification purposes, and is not displayed.

When the Action is invoked, it will update only the badge names that have changed, to allow for more persistent data. Whenever a badge is invoked, a push is made to the repo updating the file. No badge data is stored server-side.

The actual badges are generated by [Badgen](https://github.com/badgen/badgen) (A great service/API, check it out if you have a chance!). The hosted endpoint uses the code [here](https://github.com/RubbaBoy/BYOB/blob/master/workers/src/handler.ts). It reads the given repositories' JSON file containing shields data in it, and returns a Badgen-generated badge.
