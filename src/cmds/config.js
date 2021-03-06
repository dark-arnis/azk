import { _, t } from 'azk';
import { CliTrackerController } from 'azk/cli/cli_tracker_controller.js';
import { promiseResolve } from 'azk/utils/promises';
import { ConfigurationVoidValueError } from 'azk/utils/errors';

export default class Config extends CliTrackerController {
  constructor(...args) {
    super(...args);
    this.require_terms = false;
  }

  // list all configuration
  list(cli) {
    let key_param  = cli['config-key'];
    let configList = this.configuration.listAll();

    if (key_param) {
      configList = _.filter(configList, (item) => {
        return item.key === key_param;
      });
    }

    if (configList.length === 0) {
      this.ui.info('commands.config.key_not_found', {key: key_param});
    }

    let getType = (type) => {
      if (type === 'boolean') {
        return this.ui.c.gray('[Y/N]');
      }
      if (type === 'string') {
        return this.ui.c.gray('[text]');
      }
      if (type === 'number') {
        return this.ui.c.gray('[number]');
      }
      return '';
    };

    let getValue = (value) => {
      if (typeof value === 'undefined' || value === null) {
        return this.ui.c.gray.bold('(not set)');
      }
      if (value === true) {
        return this.ui.c.green.bold('Y');
      }
      if (value === false) {
        return this.ui.c.green.bold('N');
      }
      return this.ui.c.bold(value.toString());
    };

    let getDescription = (key) => {
      return t('commands.config.descriptions.' + key);
    };

    let table = this.ui.table_add('status', {
      head: [
        this.ui.c.green("key"),
        this.ui.c.green("type"),
        this.ui.c.green('value'),
        this.ui.c.green('description'),
      ],
      text: true
    });

    _.each(configList, (configItem) => {
      if (cli.verbose >= configItem.verbose_level) {
        let line = [
          configItem.key,
          getType(configItem.type),
          getValue(configItem.value),
          getDescription(configItem.key)
        ];
        this.ui.table_push(table, line);
      }
    });

    this.ui.table_show(table);

    return promiseResolve(0);
  }

  // resets all configuration
  reset() {
    return this
      .askConfirmation('commands.config.reset.ask_confirmation', true)
      .then((result) => {
        if (result) {
          this.configuration.resetAll();
          this.ui.ok('commands.config.reset.confirmed');
        }
        return promiseResolve(0);
      });
  }

  // set a configuration
  set(cmd) {
    let key_param = cmd['config-key'];
    let value_param = cmd['config-value'];

    if (key_param && value_param) {
      // value exist
      let is_valid = this.configuration.validate(key_param, value_param);
      if (is_valid) {
        let converted_value = this.configuration.convertInputValue(key_param, value_param);
        this.configuration.save(key_param, converted_value);
        this.ui.ok('commands.config.set_ok', {
          key: key_param,
          value: converted_value,
        });
      }
      return promiseResolve(0);
    } else {
      let config_item;
      // get and validate key
      if (key_param) {
        config_item = this.configuration.getKey(key_param);
      }
      // no value, throw error
      if (!value_param) {
        throw new ConfigurationVoidValueError(key_param);
      }
    }
  }
}
