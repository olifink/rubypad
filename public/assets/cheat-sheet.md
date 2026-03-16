# Ruby Cheat Sheet

## Variables & Types
```ruby
x = 42          # Integer
pi = 3.14       # Float
name = "RubyPad" # String
flag = true     # TrueClass
nothing = nil   # NilClass
sym = :hello    # Symbol
```

## Strings
```ruby
"Hello, #{name}!"          # interpolation
'no #{interpolation} here' # single-quoted
s.upcase   s.downcase   s.strip   s.chomp
s.split(",")   [1,2].join(", ")
s[0]   s[-1]   s[1..3]   s.reverse
s.include?("Ruby")   s.start_with?("R")
s.length   s.chars   s.gsub(/\s+/, "_")
```

## Conditions
```ruby
if x > 0
  puts "positive"
elsif x == 0
  puts "zero"
else
  puts "negative"
end

puts x > 0 ? "pos" : "non-pos"   # ternary
puts "ok" if x > 0               # inline if
puts "bad" unless x > 0          # inline unless

case x
when 1..9   then puts "single digit"
when 10, 20 then puts "10 or 20"
else             puts "other"
end
```

## Loops
```ruby
5.times { |i| puts i }           # 0–4
(1..5).each { |i| puts i }       # 1–5
(0..8).step(2) { |i| puts i }    # 0,2,4,6,8

arr.each { |v| puts v }
arr.each_with_index { |v, i| puts "#{i}: #{v}" }

while cond
  break if done
  next if skip
end

loop do
  break if done
end
```

## Arrays
```ruby
arr = [3, 1, 2]
arr.push(4)    arr.pop
arr.unshift(0) arr.shift
arr << 5
arr.sort   arr.sort.reverse
arr[1..3]  arr.first(2)  arr.last(2)
arr.flatten   arr.compact   arr.uniq
arr.include?(3)   arr.count   arr.sum
arr.min   arr.max   arr.sample
a, b, *rest = arr   # destructuring
```

## Hashes
```ruby
h = { a: 1, b: 2 }          # symbol keys
h = { "a" => 1, "b" => 2 }  # string keys
h[:c] = 3   h.delete(:a)
h.fetch(:x, 0)               # default value
h.key?(:b)   h.value?(2)
h.keys   h.values   h.to_a
h.each { |k, v| puts "#{k}: #{v}" }
h.map { |k, v| [k, v * 2] }.to_h
h.select { |k, v| v > 1 }
h.merge({ d: 4 })
```

## Enumerables
```ruby
arr.map { |x| x ** 2 }
arr.select { |x| x > 0 }
arr.reject { |x| x > 0 }
arr.reduce(0) { |sum, x| sum + x }
arr.reduce(:+)                    # shorthand
arr.find { |x| x > 2 }
arr.all? { |x| x > 0 }
arr.any? { |x| x > 0 }
arr.none? { |x| x < 0 }
arr.flat_map { |x| [x, x * 2] }
arr.zip([4, 5, 6])
arr.each_slice(2).to_a
arr.group_by { |x| x % 2 == 0 ? :even : :odd }
```

## Functions (Methods)
```ruby
def greet(name, greeting: "Hello")
  "#{greeting}, #{name}!"
end

greet("world")
greet("world", greeting: "Hi")

def variadic(*args, **opts)
  args.inspect
end

double = ->(x) { x * 2 }   # lambda
double.call(5)              # => 10
double.(5)                  # shorthand
```

## Classes & Modules
```ruby
class Animal
  attr_accessor :name

  def initialize(name)
    @name = name
  end

  def speak
    "..."
  end

  def to_s
    "Animal(#{@name})"
  end
end

class Dog < Animal
  def speak
    "#{@name}: Woof!"
  end
end

module Greetable
  def greet
    "Hi, I'm #{name}"
  end
end

class Person
  include Greetable
  attr_reader :name
  def initialize(name) = @name = name
end
```

## Error Handling
```ruby
begin
  result = 10 / x
rescue ZeroDivisionError => e
  puts "Error: #{e.message}"
rescue TypeError, ArgumentError
  puts "Bad input"
else
  puts "no error"
ensure
  puts "always runs"
end

raise ArgumentError, "bad value"
raise unless x > 0        # inline guard
```

## Useful Built-ins
```ruby
x.class   x.is_a?(Integer)   x.respond_to?(:to_s)
x.nil?    x.zero?    x.even?    x.odd?
x.to_s    x.to_i     x.to_f     x.to_a
x.freeze  x.frozen?  x.dup
puts x    print x    p x        pp x
rand      rand(10)   [1,2,3].sample
Math::PI  Math.sqrt(2)  Math.log(100, 10)
```

## Symbols & Ranges
```ruby
:foo.to_s          # "foo"
"foo".to_sym       # :foo
(1..10).to_a       # [1..10] inclusive
(1...10).to_a      # [1..9]  exclusive
(1..10).cover?(5)  # true
("a".."e").to_a    # ["a","b","c","d","e"]
```

## String Formatting
```ruby
"%d items at $%.2f each" % [3, 4.5]
format("%.4f", Math::PI)
sprintf("%08b", 42)   # binary with padding
```
