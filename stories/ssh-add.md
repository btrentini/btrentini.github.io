---
title: Adding SSH Keys to GitLab (Corporate) and Github (Personal)
layout: default
nav_exclude: true
date: "2023-06-07"
short_desc: "Host key verification failed, Permission Denied, Bad Permissions, Error in libcrypto and other annoying issues you can prevent by ssh keys organization"
thumbnail: "/assets/images/cybersec/cybersec.jpg"
category: "post"
---
7th June 2023
# The correct way to set up SSH keys for both Gitlab and Github

You work for an organization who requires you to use a private instance of Gitlab while you have other open-source contributions on Github. How to manage SSH keys?

This is a simple solution I've found to avoid mixing up SSH keys, ensure higher levels of security and have more governance over my keys. 

## 1st step: create your Gitlab (Corporate) Key

This can be done with the `ssh-keygen` command:

```shell
ssh-keygen -t ed25519 -C "<comment>"
```

⭐ **Important**: specify a directory and a filename such as `~/.ssh/gitlab_key`


Copy the contents of this file (use vim, xclip, or any other method)
## 2nd step: add keys to GitLab
Go to your Gitlab account and under settings, add a new SSH key. This is similar to what is described here: [https://docs.gitlab.com/ee/user/ssh.html](https://docs.gitlab.com/ee/user/ssh.html)

## 3rd step: add keys ssh-agent

After you've done this, you must add your key to the SSH agent

```shell
ssh-add ~/.ssh/gitlab_key
```

## 4th step: add URL to known hosts

and add your corporation's URL to known hosts 


```shell
ssh-keyscan -H <url of your organization> >> ~/.ssh/known_hosts
```

## 5th step: change config file

Finally, you must edit the `~/.ssh/config` file (or create one) with the following

```shell
Host <company gitlab url>
  Hostname <company gitlab url>
  PreferredAuthentications publickey
  IdentityFile ~/.ssh/gitlab_key
```

## Enjoy
This should work fine. Then repeat the process for your Github account, with the 4th and 5th steps being optional :)