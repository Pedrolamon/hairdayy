
import { HiOutlineMail, HiOutlinePhone } from 'react-icons/hi'; 

export function Contact() {
    return (
        <div>
            
            
            <section className="bg-[#e9f3e8] min-h-screen flex flex-col justify-center items-center py-20 relative overflow-hidden">
                
                <div className="absolute top-0 left-0 w-3/4 h-3/4 bg-[#6d8d7e] rounded-br-[200px]"></div>
                
                <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-[#a8795a] rounded-tl-[200px]"></div>
                
                <div className="container mx-auto px-4 relative z-10 flex flex-col md:flex-row bg-white rounded-3xl shadow-2xl p-8 md:p-16">
                    
                    <div className="md:w-1/2 md:pr-12">
                        <h1 className="font-playfair text-5xl font-bold text-[#333333] mb-2">Contact Us</h1>
                        <p className="font-playfair text-xl text-gray-500 mb-8">
                            We are ready to help you and listen to your ideas.
                        </p>
                        <form className="space-y-6">
                            <input type="text" placeholder="Name" className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a8795a] bg-gray-100" />
                            <input type="email" placeholder="E-mail" className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a8795a] bg-gray-100" />
                            <input type="text" placeholder="Subject" className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a8795a] bg-gray-100" />
                            <textarea rows={6} placeholder="Your message..." className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a8795a] bg-gray-100"></textarea>
                            <button type="submit" className="bg-[#a8795a] text-white px-8 py-4 rounded-full font-bold inline-block hover:bg-[#8e684a] transition-colors">
                                Send
                            </button>
                        </form>
                    </div>
                    
                    <div className="md:w-1/2 md:pl-12 mt-12 md:mt-0 flex flex-col space-y-12">
                        
                        <div>
                            <h3 className="font-playfair text-3xl font-bold text-[#333333] mb-4">Contact</h3>
                            <ul className="space-y-4">
                                <li className="flex items-center text-gray-700">
                                    <HiOutlineMail className="mr-3 text-2xl text-[#6d8d7e]" />
                                    <span className="text-lg">Contact@twotrails.com</span>
                                </li>
                                <li className="flex items-center text-gray-700">
                                    <HiOutlinePhone className="mr-3 text-2xl text-[#6d8d7e]" />
                                    <span className="text-lg">(24) 99225-4110</span>
                                </li>
                            </ul>
                        </div>
                        
                        <div>
                            <h3 className="font-playfair text-3xl font-bold text-[#333333] mb-4">Frequently Asked Questions</h3>
                            <ul className="space-y-6">
                                <li>
                                    <h5 className="font-bold text-lg text-gray-800">What are the subscription plans</h5>
                                    <p className="text-sm text-gray-600">we offer flexible plans to adapt to your business's size. Visit our solution page for more details .</p>
                                </li>
                                <li>
                                    <h5 className="font-bold text-lg text-gray-800">Do you offer support?</h5>
                                    <p className="text-sm text-gray-600">Yes, our support is available 24/7 to ensure yout journey is smooth and productive</p>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>
            
        </div>
    );
}