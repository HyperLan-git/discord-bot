import sys
import asyncio
import cleverbotfree


with cleverbotfree.sync_playwright() as p_w:
    c_b = cleverbotfree.Cleverbot(p_w)
    while True:
        user_input = input()
        bot = c_b.single_exchange(user_input)
        print(bot)
