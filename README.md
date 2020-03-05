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
        uses: RubbaBoy/BYOB@v1.0.0-SNAPSHOT.19
        with:
          NAME: time
          LABEL: 'Updated at'
          STATUS: ${{ steps.date.outputs.data }}
          COLOR: 00EEFF
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Using this badge (Named `time`) in the repository `RubbaBoy/Example` is as simple as:

```markdown
![](https://runkit.io/rubbaboy/byob/branches/master/RubbaBoy/Example/time)
```

This badge looks like:

![](https://runkit.io/rubbaboy/byob/branches/master/RubbaBoy/BYOBTest/time)

Other URL schemes are supported as well. The general scheme after `https://runkit.io/rubbaboy/byob/branches/master/` is:

```
/nameOrOrg/repo/badgeName/branch/path/to/shields.json
```

Only up to `branch` is required. The following are examples of more advanced badge URLs.

#### Basic off-master badge

Badges may be used off of the master branch. For example, on the `dev` branch:

```markdown
![](https://runkit.io/rubbaboy/byob/branches/master/RubbaBoy/Example/time/dev)
```

#### Custom Path

Badges may also use custom JSON paths, allowing for multiple files per project for whatever your usecase may be. The branch must be included in this URL. The following shows a path to `/child/dir/badges.json`

```markdown
![](https://runkit.io/rubbaboy/byob/branches/master/RubbaBoy/Example/time/master/child/dir/badges.json)
```



### Inputs

All inputs are required except for the last one displayed below.

| **Name**     | **Default**     | **Description**                                              |
| ------------ | --------------- | ------------------------------------------------------------ |
| name         |                 | The alphanumeric (-_ included) name of the badge, 32 chars or less. Used only for identification purposes. |
| label        |                 | The left label of the badge, usually static.                 |
| status       |                 | The right status as the badge, usually based on results.     |
| color        |                 | The hex color of the badge.                                  |
| github_token |                 | The GitHub token to push to the current repo. Suggested as `${{ secrets.GITHUB_TOKEN }}` |
| path         | `/shields.json` | The absolute file path to store the JSON data to.            |

## How It Works

BYOB is very simple, consisting of the GitHub Action and a small server-side script. The Action updates a branch-specific json file, containing data about all badges available (Any repo may use these). Each badge has a name associated with it only used for identification purposes, and is not displayed.

When the Action is invoked, it will update only the badge names that have changed, to allow for more persistent data. Whenever a badge is invoked, a push is made to the repo updating the file. No badge data is stored server-side.

The server-side script is hosted by [Runkit](https://runkit.com/), with the actual badges hosted by [Badgen](https://badgen.net/) (Both are great services, check them out if you have a chance!). The hosted Runkit script may be found [here](https://runkit.com/rubbaboy/byob) (Or on the GitHub repo [here](https://github.com/RubbaBoy/BYOB/blob/master/index.js)), and can simply be forked and changed to use for your own purposes. It reads the given repositories' JSON file containing shields data in it, and returns a Badgen-generated badge. This uses the static Badgen `/badge`  endpoint to allow for much less caching, as paired with GitHub's aggressive caching it can be extremely slow.

