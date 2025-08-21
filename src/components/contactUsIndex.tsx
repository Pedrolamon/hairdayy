
import { HiOutlineMail, HiOutlinePhone } from 'react-icons/hi'; // Exemplo de importação de ícones

export function Contact() {
    return (
        <div>
            
            {/* Seção Principal com o layout e as formas de fundo */}
            <section className="bg-[#e9f3e8] min-h-screen flex flex-col justify-center items-center py-20 relative overflow-hidden">
                
                {/* Forma orgânica de fundo 1 (Verde Musgo) */}
                <div className="absolute top-0 left-0 w-3/4 h-3/4 bg-[#6d8d7e] rounded-br-[200px]"></div>
                
                {/* Forma orgânica de fundo 2 (Marrom) */}
                <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-[#a8795a] rounded-tl-[200px]"></div>
                
                {/* Container principal com o formulário e informações */}
                <div className="container mx-auto px-4 relative z-10 flex flex-col md:flex-row bg-white rounded-3xl shadow-2xl p-8 md:p-16">
                    
                    {/* Coluna da Esquerda: Título e Formulário */}
                    <div className="md:w-1/2 md:pr-12">
                        <h1 className="font-playfair text-5xl font-bold text-[#333333] mb-2">Fale Conosco</h1>
                        <p className="font-playfair text-xl text-gray-500 mb-8">
                            Estamos prontos para te ajudar e ouvir suas ideias.
                        </p>
                        <form className="space-y-6">
                            <input type="text" placeholder="Nome" className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a8795a] bg-gray-100" />
                            <input type="email" placeholder="E-mail" className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a8795a] bg-gray-100" />
                            <input type="text" placeholder="Assunto" className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a8795a] bg-gray-100" />
                            <textarea rows={6} placeholder="Sua Mensagem..." className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a8795a] bg-gray-100"></textarea>
                            <button type="submit" className="bg-[#a8795a] text-white px-8 py-4 rounded-full font-bold inline-block hover:bg-[#8e684a] transition-colors">
                                Enviar
                            </button>
                        </form>
                    </div>
                    
                    {/* Coluna da Direita: Informações e FAQ */}
                    <div className="md:w-1/2 md:pl-12 mt-12 md:mt-0 flex flex-col space-y-12">
                        
                        {/* Bloco de Contato Alternativo */}
                        <div>
                            <h3 className="font-playfair text-3xl font-bold text-[#333333] mb-4">Contato</h3>
                            <ul className="space-y-4">
                                <li className="flex items-center text-gray-700">
                                    <HiOutlineMail className="mr-3 text-2xl text-[#6d8d7e]" />
                                    <span className="text-lg">contato@twotrails.com</span>
                                </li>
                                <li className="flex items-center text-gray-700">
                                    <HiOutlinePhone className="mr-3 text-2xl text-[#6d8d7e]" />
                                    <span className="text-lg">(24) 99225-4110</span>
                                </li>
                            </ul>
                        </div>
                        
                        {/* Bloco de Perguntas Frequentes */}
                        <div>
                            <h3 className="font-playfair text-3xl font-bold text-[#333333] mb-4">Perguntas Frequentes</h3>
                            <ul className="space-y-6">
                                <li>
                                    <h5 className="font-bold text-lg text-gray-800">Quais são os planos de assinatura?</h5>
                                    <p className="text-sm text-gray-600">Oferecemos planos flexíveis para se adaptar ao tamanho do seu negócio. Visite nossa página de soluções para mais detalhes.</p>
                                </li>
                                <li>
                                    <h5 className="font-bold text-lg text-gray-800">Vocês oferecem suporte?</h5>
                                    <p className="text-sm text-gray-600">Sim, nosso suporte está disponível 24/7 para garantir que sua jornada seja tranquila e produtiva.</p>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>
            
        </div>
    );
}