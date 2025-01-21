'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

export default function Metrics() {
  const metrics = [
    { label: 'Trust', value: 75 },
    { label: 'Accuracy', value: 82 },
    { label: 'Reliability', value: 65 },
    { label: 'Confidence', value: 90 }
  ]

  const [animatedValues, setAnimatedValues] = useState(metrics.map(() => 0))

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValues(metrics.map(metric => metric.value))
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Key Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-4"
            >
              <div className="w-24 text-sm text-muted-foreground">
                {metric.label}
              </div>
              <div className="flex-1">
                <Progress value={animatedValues[index]} className="h-2" />
              </div>
              <div className="w-12 text-sm text-muted-foreground text-right">
                {animatedValues[index].toFixed(0)}%
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

