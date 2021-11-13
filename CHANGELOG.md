# 0.5.5
#### Fix some problems of number functions and add some similar number functions

- Fix problems below:
	- The number function did not work well in multi-selection mode. 
		Only the last selection will be replaced because of the key duplication of "selectionMap"
	- The sequence function only make sequence for each selection in multi-selection mode, a global sequence can not be create.
		And it just seems like to be not working when we got only one number in each selection.
- Add functions below:
	- duplicateNumAndIncrement: Duplicate the number part and increment new number copies
	- duplicateNumAndDecrement: Duplicate the number part and decrement new number copies
	- incrementWithZero: Increment all numbers with 0 paddings at left
	- decrementWithZero: Decrement all numbers with 0 paddings at left
	- duplicateAndIncrementWithZero: Duplicate and increment all numbers with 0 paddings at left
	- duplicateAndDecrementWithZero: Duplicate and decrement all numbers with 0 paddings at left
	- duplicateNumAndIncrementWithZero: Duplicate the number part and increment new number copies with 0 paddings at left
	- duplicateNumAndDecrementWithZero: Duplicate the number part and decrement new number copies with 0 paddings at left
	- sequenceWithZero: Sequence all numbers with 0 paddings at left (starting with first number)

# 0.3.0
- 1673eb3 Add slugify and fix #6,#7

# 0.2.0
- e497c8b Add screaming snake case - fixes #6

# 0.1.0
- 824e06e Add Chicago and AP style titleization. Fixes #2.
- 7bc9db1 Manipulate strings without joining lines. Fixes #1.
- 6e00b93 Adding .vscode dir for running local extension
- c6bb1b8 Using yarn package manager
- 2dab680 Update README.md
