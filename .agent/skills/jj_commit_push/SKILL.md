---
name: jj_commit_push
description: Commit changes and push to remote using jj (Jujutsu)
---

# Commit and Push with JJ

This skill automates the process of saving changes and pushing them to the remote repository using `jj`.

## Steps

1.  **Check Status**: Verify current changes.
    ```bash
    jj status
    ```

2.  **Describe Change**: Give the current working set a description (commit message).
    ```bash
    jj describe -m "${COMMIT_MESSAGE}"
    ```
    *Replace `${COMMIT_MESSAGE}` with a descriptive summary of your changes.*

3.  **Update Main Bookmark**: Move the `main` bookmark to the current revision.
    ```bash
    jj bookmark set main -r @
    ```

4.  **Push**: Push the `main` bookmark to the remote.
    ```bash
    jj git push
    ```

5.  **New Working Copy**: Create a new working copy off `main` to continue working.
    ```bash
    jj new main
    ```

## Usage

When the user asks to "commit and push" or "save changes":
1.  Ask for a commit message if one wasn't provided or infer a good one from context.
2.  Execute the commands in order.
