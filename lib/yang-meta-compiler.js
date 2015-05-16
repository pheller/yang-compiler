// Generated by CoffeeScript 1.9.1
(function() {
  var Extension, Meta, YangMetaCompiler,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    slice = [].slice;

  Meta = require('meta-class');

  Extension = (function() {
    function Extension(params1) {
      this.params = params1 != null ? params1 : {};
      this;
    }

    Extension.prototype.refine = function(params) {
      if (params == null) {
        params = {};
      }
      return Meta.copy(this.params, params);
    };

    Extension.prototype.resolve = function(target, compiler) {
      var arg, params, ref, ref1;
      switch (this.params.argument) {
        case 'value':
        case 'text':
        case 'date':
          return {
            name: target.get('yang'),
            value: target.get('name')
          };
      }
      if (this.params.resolver == null) {
        throw new Error("no resolver found for '" + (target.get('yang')) + "' extension", target);
      }
      arg = (target.get('name')).replace(':', '.');
      params = {};
      if ((ref = target.get('children')) != null) {
        ref.forEach(function(e) {
          switch (false) {
            case !((Meta["instanceof"](e)) && (e.get('children')).length === 0):
              return params[e.get('yang')] = e.get('name');
            case (e != null ? e.constructor : void 0) !== Object:
              return params[e.name] = e.value;
          }
        });
      }
      return (ref1 = this.params.resolver) != null ? typeof ref1.call === "function" ? ref1.call(compiler, target, arg, params) : void 0 : void 0;
    };

    return Extension;

  })();

  YangMetaCompiler = (function(superClass) {
    var assert;

    extend(YangMetaCompiler, superClass);

    function YangMetaCompiler() {
      return YangMetaCompiler.__super__.constructor.apply(this, arguments);
    }

    assert = require('assert');

    YangMetaCompiler.set({
      extensions: {
        extension: new Extension({
          argument: 'extension-name',
          'sub:description': '0..1',
          'sub:reference': '0..1',
          'sub:status': '0..1',
          'sub:sub': '0..n',
          resolver: function(self, arg, params) {
            var ext;
            ext = this.get("extensions." + arg);
            if (ext == null) {
              if (params.resolver == null) {
                params.resolver = this.get("resolvers." + arg);
              }
              ext = new Extension(params);
              this.set("extensions." + arg, ext);
            } else {
              ext.refine(params);
            }
            return ext;
          }
        }),
        argument: new Extension({
          'sub:yin-element': '0..1',
          resolver: function(self, arg) {
            return {
              name: 'argument',
              value: arg
            };
          }
        }),
        'yin-element': new Extension({
          argument: 'value'
        }),
        value: new Extension({
          resolver: function(self, arg) {
            return {
              name: 'value',
              value: arg
            };
          }
        }),
        sub: new Extension({
          resolver: function(self, arg, params) {
            return {
              name: "sub:" + arg,
              value: params
            };
          }
        }),
        prefix: new Extension({
          argument: 'value'
        }),
        include: new Extension({
          argument: 'name',
          resolver: function(self, arg, params) {
            var source;
            source = this.get("map." + arg);
            assert(typeof source === 'string', "unable to include '" + arg + "' without mapping defined for source");
            return this.compile(function() {
              var file, path, ref;
              path = require('path');
              file = path.resolve(path.dirname((ref = module.parent) != null ? ref.filename : void 0), source);
              console.log("INFO: including '" + arg + "' using " + file);
              return (require('fs')).readFileSync(file, 'utf-8');
            });
          }
        })
      }
    });

    YangMetaCompiler.prototype.resolver = function(meta, context) {
      var err, ext, i, prefix, ref, yang;
      yang = meta.get('yang');
      if (typeof yang === 'string') {
        ref = yang.split(':'), prefix = 2 <= ref.length ? slice.call(ref, 0, i = ref.length - 1) : (i = 0, []), yang = ref[i++];
      }
      ext = (function() {
        var ref1;
        switch (false) {
          case !(prefix.length > 0):
            return (ref1 = this.get("" + prefix[0])) != null ? ref1.get("extensions." + yang) : void 0;
          default:
            return this.get("extensions." + yang);
        }
      }).call(this);
      try {
        return ext.resolve(meta, this);
      } catch (_error) {
        err = _error;
        if (this.errors == null) {
          this.errors = [];
        }
        this.errors.push({
          yang: yang,
          error: err
        });
        return void 0;
      }
    };

    YangMetaCompiler.prototype.assembler = function(dest, src) {
      var k, objs, v;
      objs = (function() {
        var ref, results1;
        switch (false) {
          case src.collapse !== true:
            ref = src.get('bindings');
            results1 = [];
            for (k in ref) {
              v = ref[k];
              results1.push({
                name: k,
                value: v
              });
            }
            return results1;
            break;
          case !(Meta["instanceof"](src)):
            return {
              name: this.normalizeKey(src),
              value: src
            };
          case src.constructor !== Object:
            return src;
        }
      }).call(this);
      if (!(objs instanceof Array)) {
        objs = [objs];
      }
      return Meta.bind.apply(dest, objs);
    };

    YangMetaCompiler.prototype.normalizeKey = function(meta) {
      return ([meta.get('yang'), meta.get('name')].filter(function(e) {
        return (e != null) && !!e;
      })).join('.');
    };

    YangMetaCompiler.prototype.parse = function(schema, parser) {
      var keyword, normalize, results, statement, stmt;
      if (parser == null) {
        parser = require('yang-parser');
      }
      if (typeof schema === 'string') {
        return this.parse(parser.parse(schema));
      }
      if (!((schema != null) && schema instanceof Object)) {
        return;
      }
      statement = schema;
      normalize = function(obj) {
        return ([obj.prf, obj.kw].filter(function(e) {
          return (e != null) && !!e;
        })).join(':');
      };
      keyword = normalize(statement);
      results = ((function() {
        var i, len, ref, results1;
        ref = statement.substmts;
        results1 = [];
        for (i = 0, len = ref.length; i < len; i++) {
          stmt = ref[i];
          results1.push(this.parse(stmt));
        }
        return results1;
      }).call(this)).filter(function(e) {
        return e != null;
      });
      return (function(superClass1) {
        extend(_Class, superClass1);

        function _Class() {
          return _Class.__super__.constructor.apply(this, arguments);
        }

        _Class.set({
          yang: keyword,
          name: statement.arg,
          children: results
        });

        return _Class;

      })(require('meta-class'));
    };

    YangMetaCompiler.prototype.compile = function(schema) {
      if (schema instanceof Function) {
        schema = schema.call(this);
      }
      if (typeof schema !== 'string') {
        return;
      }
      return this.fork(function() {
        var ext, name, output, ref, self;
        this.set('extensions', this.constructor.get('extensions'));
        ref = this.get('extensions');
        for (name in ref) {
          ext = ref[name];
          if ((this.get("resolvers." + name)) instanceof Function) {
            ext.refine({
              resolver: this.get("resolvers." + name)
            });
          }
        }
        output = this.parse(schema).map((function(_this) {
          return function() {
            return _this.resolver.apply(_this, arguments);
          };
        })(this)).reduce((function(_this) {
          return function() {
            return _this.assembler.apply(_this, arguments);
          };
        })(this));
        if (this.errors != null) {
          console.log("WARN: the following errors were encountered by the compiler");
          console.log(this.errors);
        }
        self = this;
        return output.configure(function() {
          this.set("schema", schema);
          return this.merge(self.extract('map', 'extensions', 'exports'));
        });
      });
    };

    return YangMetaCompiler;

  })(Meta);

  module.exports = YangMetaCompiler;

}).call(this);