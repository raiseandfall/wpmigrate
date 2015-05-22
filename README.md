# WORDPRESS DB MIGRATE

> A CL tool to migrate a Wordpress Database between different environments ( dev, staging, prod, ... ).
  
Inspired by [grunt-wordpress-deploy](https://github.com/webrain/grunt-wordpress-deploy/).
Modified to run as a Node package.


## REQUIREMENTS
- ```mysqldump```


## USAGE

### 1. Create a configuration file ```.wprc``` 
This file can be wherever on your computer but you'll need to call wpmigrate on the same level. 

### ATTENTION: It's safe to place the file out of the git repository since it should never be tracked by git (contains database credentials). 

This file contains the configuration of the different environments databases. You can create as much env as you want.
Each environment object contains its database credentials as well as the URL of the Wordpress project on this environment.

__NOTE__ 
- The ```url``` field needs to have a protocol & the full host used in the Wordpress config. No trailing slash !
- The ```options``` object contains the backup directory name you want to use. Backups are made every time any migration happens.



```json
{
  "options": {
    "backup_dir": "backups"
  },
  "environments": {
    "development": {
      "title": "development",
      "database": "DB_NAME",
      "user": "USER_DEV",
      "pass": "PASSWORD_DEV",
      "host": "HOST_DEV",
      "url": "http://development.url"
    },
    "staging": {
      "title": "staging",
      "database": "DB_NAME",
      "user": "USER_STAGING",
      "pass": "PASSWORD_STAGING",
      "host": "HOST_STAGING",
      "url": "http://staging.url"
    },
    "production": {
      "title": "production",
      "database": "DB_NAME",
      "user": "USER_PROD",
      "pass": "PASSWORD_PROD",
      "host": "HOST_PROD",
      "url": "http://prod.url"
    }
  }
}
```

### 2. Run

```shell
$ wpmigrate --from=<source> --to=<target>
```

- ```from``` flag is the source environment
- ```to``` flag is the target environment

Example: 
```shell
$ wpmigrate --from=development --to=staging
```

This will migrate the database from the development env to the staging env.
