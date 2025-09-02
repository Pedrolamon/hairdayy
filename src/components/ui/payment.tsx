import { Input } from "./input"
import { Label } from "./label"
import { RadioGroup, RadioGroupItem } from "./radio-group"
import { Textarea } from "./textarea"
import { Checkbox } from "./checkbox"
import { Button } from "./button"

export default function SubscriptionForm() {
  return (
    <div className="p-6 border rounded-lg max-w-lg mx-auto bg-white dark:bg-gray-900 shadow-sm">
      <h2 className="text-xl font-semibold mb-2">Mude a forma de pagamento</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Minhas inforamções 
      </p>

      {/* Inputs para Nome e Email */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" placeholder="João da silva" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="exemplo@gmail.com" />
        </div>
      </div>

      {/* Detalhes do Cartão */}
      <div className="space-y-2 mb-4">
        <Label htmlFor="cardNumber">Número do Cartão</Label>
        <div className="grid grid-cols-3 gap-2">
          <Input id="cardNumber" placeholder="1234 1234 1234 1234" className="col-span-2" />
          <Input placeholder="MM/YY" />
          <Input placeholder="CVC" />
        </div>
      </div>

      {/* Seleção de Plano */}
      <div className="space-y-2 mb-4">
        <Label>Plano</Label>
        <p className="text-sm text-gray-500 dark:text-gray-400">Escolha o melhor plano para você.</p>
        <RadioGroup defaultValue="starter" className="grid grid-cols-2 gap-4 mt-2">
          <div className="border rounded-md p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <RadioGroupItem value="starter" id="starter" className="sr-only" />
            <Label htmlFor="starter" className="flex items-center space-x-2">
              <span className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center peer-data-[state=checked]:bg-black peer-data-[state=checked]:text-white dark:peer-data-[state=checked]:bg-white dark:peer-data-[state=checked]:text-black">
                <span className="w-2 h-2 rounded-full bg-white dark:bg-black" />
              </span>
              <div className="flex flex-col">
                <span className="font-semibold text-sm">Plano Basico</span>
                <span className="text-xs text-muted-foreground">Perfeito para pessoas que estão inciando.</span>
              </div>
            </Label>
          </div>
          <div className="border rounded-md p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <RadioGroupItem value="pro" id="pro" className="sr-only" />
            <Label htmlFor="pro" className="flex items-center space-x-2">
              <span className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center peer-data-[state=checked]:bg-black peer-data-[state=checked]:text-white dark:peer-data-[state=checked]:bg-white dark:peer-data-[state=checked]:text-black">
                <span className="w-2 h-2 rounded-full bg-white dark:bg-black" />
              </span>
              <div className="flex flex-col">
                <span className="font-semibold text-sm">Plano Completo</span>
                <span className="text-xs text-muted-foreground">Todas as funções disponíveis.</span>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Caixa de Notas */}
      <div className="space-y-2 mb-4">
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" placeholder="Enviar notas" className="min-h-[100px]" />
      </div>

      {/* Checkboxes */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox id="terms" />
          <Label htmlFor="terms">Eu concordo com os termos e as condições</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="emails" defaultChecked />
          <Label htmlFor="emails">Permitir contato por email</Label>
        </div>
      </div>
      
      {/* Botão de Upgrade */}
      <Button className="w-full mt-6">Mudar</Button>
    </div>
  )
}