# Ruby チートシート

## 変数と型
```ruby
x = 42          # 整数
pi = 3.14       # 浮動小数点数
name = "RubyPad" # 文字列
flag = true     # TrueClass
nothing = nil   # NilClass
sym = :hello    # シンボル
```

## 文字列
```ruby
"Hello, #{name}!"          # 補間
'no #{interpolation} here' # シングルクォート
s.upcase   s.downcase   s.strip   s.chomp
s.split(",")   [1,2].join(", ")
s[0]   s[-1]   s[1..3]   s.reverse
s.include?("Ruby")   s.start_with?("R")
s.length   s.chars   s.gsub(/\s+/, "_")
```

## 条件分岐
```ruby
if x > 0
  puts "正の数"
elsif x == 0
  puts "ゼロ"
else
  puts "負の数"
end

puts x > 0 ? "正" : "非正"     # 三項演算子
puts "OK" if x > 0            # インライン if
puts "エラー" unless x > 0      # インライン unless

case x
when 1..9   then puts "一桁"
when 10, 20 then puts "10 または 20"
else             puts "その他"
end
```

## ループ
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

## 配列
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
a, b, *rest = arr   # 分割代入
```

## ハッシュ
```ruby
h = { a: 1, b: 2 }          # シンボルキー
h = { "a" => 1, "b" => 2 }  # 文字列キー
h[:c] = 3   h.delete(:a)
h.fetch(:x, 0)               # デフォルト値
h.key?(:b)   h.value?(2)
h.keys   h.values   h.to_a
h.each { |k, v| puts "#{k}: #{v}" }
h.map { |k, v| [k, v * 2] }.to_h
h.select { |k, v| v > 1 }
h.merge({ d: 4 })
```

## 列挙型メソッド
```ruby
arr.map { |x| x ** 2 }
arr.select { |x| x > 0 }
arr.reject { |x| x > 0 }
arr.reduce(0) { |sum, x| sum + x }
arr.reduce(:+)                    # 短縮形
arr.find { |x| x > 2 }
arr.all? { |x| x > 0 }
arr.any? { |x| x > 0 }
arr.none? { |x| x < 0 }
arr.flat_map { |x| [x, x * 2] }
arr.zip([4, 5, 6])
arr.each_slice(2).to_a
arr.group_by { |x| x % 2 == 0 ? :even : :odd }
```

## 関数（メソッド）
```ruby
def greet(name, greeting: "Hello")
  "#{greeting}, #{name}!"
end

greet("world")
greet("world", greeting: "Hi")

def variadic(*args, **opts)
  args.inspect
end

double = ->(x) { x * 2 }   # ラムダ
double.call(5)              # => 10
double.(5)                  # 短縮形
```

## クラスとモジュール
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
```
