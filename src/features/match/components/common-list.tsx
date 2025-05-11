import { Card, CardContent } from "@/shared/ui/card"

interface CommonListProps {
  items: Array<{
    icon?: string
    text: string
  }>
  title: string
}

export function CommonList({ items, title }: CommonListProps) {
  if (items.length === 0) return null

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-medium mb-3">{title}</h3>
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={index} className="flex items-center">
              {item.icon && <span className="mr-2 text-xl">{item.icon}</span>}
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
