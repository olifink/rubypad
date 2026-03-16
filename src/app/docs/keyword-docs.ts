import type { DocEntry } from './docs.service';

const REF = 'https://ruby-doc.org/core';
const SYNTAX = 'https://docs.ruby-lang.org/en/master/syntax';

export const KEYWORD_DOCS: Record<string, DocEntry> = {
  // --- Definition keywords ---
  def: {
    signature: 'def <name>(<params>)\n  ...\nend',
    description: 'Defines a method with the given name and optional parameters.',
    url: `${SYNTAX}/methods_rdoc.html`,
  },
  class: {
    signature: 'class <Name> [< SuperClass]\n  ...\nend',
    description: 'Defines a new class, optionally inheriting from a superclass.',
    url: `${SYNTAX}/modules_and_classes_rdoc.html`,
  },
  module: {
    signature: 'module <Name>\n  ...\nend',
    description: 'Defines a module — a namespace and mixin container.',
    url: `${SYNTAX}/modules_and_classes_rdoc.html`,
  },

  // --- Control flow ---
  if: {
    signature: 'if <condition>\n  ...\nend',
    description: 'Executes its block when the condition is truthy.',
    url: `${SYNTAX}/control_expressions_rdoc.html#label-if+Expression`,
  },
  elsif: {
    signature: 'elsif <condition>',
    description: 'Alternative condition branch inside an if/elsif/else chain.',
    url: `${SYNTAX}/control_expressions_rdoc.html#label-if+Expression`,
  },
  else: {
    signature: 'else',
    description: 'Fallback branch executed when no preceding condition matched.',
    url: `${SYNTAX}/control_expressions_rdoc.html#label-if+Expression`,
  },
  unless: {
    signature: 'unless <condition>\n  ...\nend',
    description: 'Executes its block when the condition is falsy (opposite of if).',
    url: `${SYNTAX}/control_expressions_rdoc.html#label-unless+Expression`,
  },
  case: {
    signature: 'case <expr>\nwhen <val> then ...\nend',
    description: 'Pattern-matching switch: tests the expression against each when clause.',
    url: `${SYNTAX}/control_expressions_rdoc.html#label-case+Expression`,
  },
  when: {
    signature: 'when <value> [, <value>]',
    description: 'A branch inside a case expression that matches specific values or patterns.',
    url: `${SYNTAX}/control_expressions_rdoc.html#label-case+Expression`,
  },
  while: {
    signature: 'while <condition>\n  ...\nend',
    description: 'Repeats its block as long as the condition is truthy.',
    url: `${SYNTAX}/control_expressions_rdoc.html#label-while+Loop`,
  },
  until: {
    signature: 'until <condition>\n  ...\nend',
    description: 'Repeats its block as long as the condition is falsy (opposite of while).',
    url: `${SYNTAX}/control_expressions_rdoc.html#label-until+Loop`,
  },
  for: {
    signature: 'for <var> in <collection>\n  ...\nend',
    description: 'Iterates over each element of a collection.',
    url: `${SYNTAX}/control_expressions_rdoc.html#label-for+Loop`,
  },
  break: {
    signature: 'break [<value>]',
    description: 'Exits the nearest enclosing loop immediately, optionally returning a value.',
    url: `${SYNTAX}/control_expressions_rdoc.html#label-break+Statement`,
  },
  next: {
    signature: 'next [<value>]',
    description: 'Skips the rest of the current loop iteration and jumps to the next one.',
    url: `${SYNTAX}/control_expressions_rdoc.html#label-next+Statement`,
  },
  return: {
    signature: 'return [<value>]',
    description: 'Exits the current method, optionally returning a value to the caller.',
    url: `${SYNTAX}/methods_rdoc.html#label-return+Values`,
  },
  yield: {
    signature: 'yield [<args>]',
    description: 'Calls the block given to the current method, passing optional arguments.',
    url: `${SYNTAX}/methods_rdoc.html#label-yield`,
  },

  // --- Exception handling ---
  begin: {
    signature: 'begin\n  ...\nrescue => e\n  ...\nensure\n  ...\nend',
    description: 'Marks a block for exception handling with optional rescue and ensure clauses.',
    url: `${SYNTAX}/exceptions_rdoc.html`,
  },
  rescue: {
    signature: 'rescue [<ExceptionClass>] [=> <var>]',
    description: 'Catches exceptions of the specified class raised inside a begin block.',
    url: `${SYNTAX}/exceptions_rdoc.html#label-rescue`,
  },
  ensure: {
    signature: 'ensure',
    description: 'Defines a cleanup block that always executes after begin/rescue, regardless of errors.',
    url: `${SYNTAX}/exceptions_rdoc.html#label-ensure`,
  },
  raise: {
    signature: 'raise [<exception>]',
    description: 'Raises an exception; with no argument it re-raises the current exception.',
    url: `${SYNTAX}/exceptions_rdoc.html#label-raise`,
  },
  retry: {
    signature: 'retry',
    description: 'Re-executes the begin block from the start; used inside a rescue clause.',
    url: `${SYNTAX}/exceptions_rdoc.html#label-retry`,
  },

  // --- Object & scope ---
  self: {
    signature: 'self',
    description: 'Refers to the current object — the receiver of the current method call.',
    url: `${SYNTAX}/modules_and_classes_rdoc.html#label-self`,
  },
  super: {
    signature: 'super [(<args>)]',
    description: 'Calls the same-named method from the parent class, forwarding arguments.',
    url: `${SYNTAX}/methods_rdoc.html#label-super`,
  },
  nil: {
    signature: 'nil',
    description: 'The sole instance of NilClass — represents the absence of a value.',
    url: `${REF}/NilClass.html`,
  },
  true: {
    signature: 'true',
    description: 'The singleton true value (instance of TrueClass).',
    url: `${REF}/TrueClass.html`,
  },
  false: {
    signature: 'false',
    description: 'The singleton false value (instance of FalseClass).',
    url: `${REF}/FalseClass.html`,
  },

  // --- Visibility ---
  public: {
    signature: 'public [<method_name>]',
    description: 'Sets the following method definitions (or named methods) to public visibility.',
    url: `${SYNTAX}/modules_and_classes_rdoc.html#label-Visibility`,
  },
  private: {
    signature: 'private [<method_name>]',
    description: 'Sets the following method definitions (or named methods) to private visibility.',
    url: `${SYNTAX}/modules_and_classes_rdoc.html#label-Visibility`,
  },
  protected: {
    signature: 'protected [<method_name>]',
    description: 'Sets the following method definitions (or named methods) to protected visibility.',
    url: `${SYNTAX}/modules_and_classes_rdoc.html#label-Visibility`,
  },

  // --- Mixins & loading ---
  include: {
    signature: 'include <ModuleName>',
    description: 'Mixes a module\'s instance methods into the current class.',
    url: `${SYNTAX}/modules_and_classes_rdoc.html#label-include`,
  },
  extend: {
    signature: 'extend <ModuleName>',
    description: 'Mixes a module\'s methods as singleton methods on the current object/class.',
    url: `${SYNTAX}/modules_and_classes_rdoc.html#label-extend`,
  },
  require: {
    signature: 'require <path>',
    description: 'Loads and executes a Ruby file or library once (subsequent calls are no-ops).',
    url: `${REF}/Kernel.html#method-i-require`,
  },
  require_relative: {
    signature: 'require_relative <path>',
    description: 'Loads a file relative to the current file\'s directory.',
    url: `${REF}/Kernel.html#method-i-require_relative`,
  },

  // --- Logical operators (keyword forms) ---
  and: {
    signature: '<x> and <y>',
    description: 'Low-precedence logical AND; evaluates y only when x is truthy.',
    url: `${SYNTAX}/operators_rdoc.html`,
  },
  or: {
    signature: '<x> or <y>',
    description: 'Low-precedence logical OR; evaluates y only when x is falsy.',
    url: `${SYNTAX}/operators_rdoc.html`,
  },
  not: {
    signature: 'not <x>',
    description: 'Low-precedence logical NOT; returns true when x is falsy.',
    url: `${SYNTAX}/operators_rdoc.html`,
  },
  in: {
    signature: '<value> in <pattern>',
    description: 'Pattern-matching operator — checks if value matches pattern (Ruby 3+).',
    url: `${SYNTAX}/pattern_matching_rdoc.html`,
  },
  do: {
    signature: 'do |<params>|\n  ...\nend',
    description: 'Begins a multi-line block passed to a method call.',
    url: `${SYNTAX}/control_expressions_rdoc.html`,
  },
  end: {
    signature: 'end',
    description: 'Closes a def, class, module, do, if, while, begin, or other block.',
    url: `${SYNTAX}/control_expressions_rdoc.html`,
  },
  then: {
    signature: 'then',
    description: 'Optional separator between the condition and body of if/unless/when.',
    url: `${SYNTAX}/control_expressions_rdoc.html`,
  },
  defined: {
    signature: 'defined?(<expr>)',
    description: 'Returns a string describing what the expression refers to, or nil if undefined.',
    url: `${SYNTAX}/miscellaneous_rdoc.html#label-defined-3F`,
  },
  alias: {
    signature: 'alias <new_name> <old_name>',
    description: 'Creates an alias (another name) for an existing method or global variable.',
    url: `${SYNTAX}/modules_and_classes_rdoc.html#label-alias`,
  },
};
