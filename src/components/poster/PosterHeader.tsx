import { motion } from 'motion/react';
import { AnimatedNumber } from '../anim/AnimatedNumber';
import { LeafFlourish } from '../icons/LeafFlourish';

/**
 * HOME-2 / HOME-3: "{N} kcal {plan title}" with leaf flourishes, then the pill strip.
 * N includes free-slot budgets; P is protein from meal items. Both are computed live by the caller
 * and count smoothly to new values (ANIM-2).
 */
export function PosterHeader({ kcal, protein, title }: { kcal: number; protein: number; title: string }) {
  return (
    <motion.header
      className="px-4 pt-5 pb-6 text-center"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-center justify-center gap-2">
        <LeafFlourish className="shrink-0" />
        <h1 className="font-serif text-[30px] leading-[1.1] font-bold text-forest">
          <AnimatedNumber value={kcal} /> kcal
          <span className="block text-[26px] font-semibold text-espresso italic">{title}</span>
        </h1>
        <LeafFlourish flip className="shrink-0" />
      </div>

      <div className="mx-auto mt-4 flex w-fit items-center gap-1.5 rounded-full border border-gold/60 bg-porcelain/70 px-3 py-1.5 text-[9.5px] font-semibold tracking-[0.1em] whitespace-nowrap text-forest uppercase">
        <span>High Protein</span>
        <span className="font-bold text-gold">·</span>
        <span>Pure Vegetarian</span>
        <span className="font-bold text-gold">·</span>
        <span className="tabular">
          <AnimatedNumber value={protein} />
          <span className="normal-case">g</span> Protein
        </span>
      </div>
    </motion.header>
  );
}
