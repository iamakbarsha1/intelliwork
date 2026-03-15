import { describe, it, expect } from 'vitest';
import { calculateLevel } from '../lib/gamification';

describe('gamification', () => {
    describe('calculateLevel', () => {
        it('should return level 1 for 0 points', () => {
            const result = calculateLevel(0);
            expect(result.level).toBe(1);
            expect(result.title).toBe('Apprentice');
            expect(result.progress).toBe(0);
        });

        it('should return level 2 at exactly 100 points', () => {
            const result = calculateLevel(100);
            expect(result.level).toBe(2);
            expect(result.progress).toBe(0);
        });

        it('should return 50% progress for 225 points (level 2)', () => {
            // Level 2 starts at 100, level 3 starts at 400.
            // 225 is almost in the middle (not exactly due to sqrt, but let's check Math.sqrt(2.25) = 1.5)
            // wait, level = floor(sqrt(225/100)) + 1 = floor(1.5) + 1 = 2
            // currentLevelPoints (level 1) = 100
            // nextLevelPoints (level 2) = 400
            // 225 - 100 = 125. 400 - 100 = 300. 125/300 = 41.6%
            const result = calculateLevel(225);
            expect(result.level).toBe(2);
            expect(result.progress).toBeCloseTo(41.6666, 1);
        });

        it('should handle high level titles', () => {
            const result = calculateLevel(9000); // sqrt(90) = 9.48. Level = 10
            expect(result.level).toBe(10);
            expect(result.title).toBe('Transcendent');
        });

        it('should cap title to the last one for very high levels', () => {
            const result = calculateLevel(1000000); // sqrt(10000) = 100. Level = 101
            expect(result.level).toBe(101);
            expect(result.title).toBe('Transcendent');
        });
    });
});
