//依赖		
import cheerio from 'cheerio'
import superagent from 'superagent'
import charset from 'superagent-charset'
import co from 'co'
import mongoose from 'mongoose'
import Books from './Models/Movie'
let request = charset(superagent)
//连接数据库
mongoose.connect('mongodb://localhost:27017/avMovies')
const Movie = Books.Movie
//流程
const baseUrl = 'http://www.quanshu.net/'   //爬取网站域名
		, inUrl = 'http://www.quanshu.net/book_25933.html'   //爬取书籍入口url
		, middleUrl = 'http://www.quanshu.net/book/78/78101/29964380.html'
		, unPicked = new Set([])   //待爬取的URL列表
		, midunPicked = new Set([])

let book = {}
// 从头开始
co(gener(inUrl))
// 从中间开始
// co(middlegen(middleUrl, inUrl, '我的绝美女神老婆'))
// 下部
// co(nextgen(middleUrl, inUrl, '我的绝美女神老婆'))

// 爬整页
function* allGen(hash) {
	const html = yield getUrl(hash, 'gbk')
			, enters = yield getAllEnters(html)

	for (let enter of enters) {
		
	}
}
// 爬整本
function* gener(hash) {
	const enterHtml = yield getUrl(hash, 'gbk')
			, In = enter(enterHtml)
			, InHtml = yield getUrl(In)
			, firstIn = splitUrl(getFirst(InHtml), In)

	yield addBook(enterHtml)
	unPicked.add(firstIn)
	for (let url of unPicked) {
		try {
			const html = yield getUrl(url, 'gbk')
			if (html === 'timeout') {
				unPicked.delete(url)
				unPicked.add(url)
			} else {
				yield	analyHtml(html, In, unPicked)
				unPicked.delete(url)
			}
		} catch (err) {
			console.log(err.message)
		}
	}
	// 结束
	return
}
// 从中间某一章开始爬
function* middlegen(midurl, hash, name) {
	const enterHtml = yield getUrl(hash, 'gbk')
			, In = enter(enterHtml)

	book = yield new Promise((resolve, reject) => {
		Movie
		.find({ name: name})
		.exec((err, books) => {
			if (err)
				reject(err)

			resolve(books[0])
		})
	})

	midunPicked.add(midurl)

	for (let url of midunPicked) {
		try {
			const html = yield getUrl(url, 'gbk')
			if (html === 'timeout') {
				midunPicked.delete(url)
				midunPicked.add(url)
			} else {
				yield	analyHtml(html, In, midunPicked)
				midunPicked.delete(url)
			}
		} catch (err) {
			console.log(err.message)
		}
	}
	// 结束
	return	
}
// 某书 (下)
function* nextgen(midurl, hash, name) {
	const enterHtml = yield getUrl(hash, 'gbk')
			, In = enter(enterHtml)

	yield addNextBook(name)

	midunPicked.add(midurl)

	for (let url of midunPicked) {
		try {
			const html = yield getUrl(url, 'gbk')
			if (html === 'timeout') {
				midunPicked.delete(url)
				midunPicked.add(url)
			} else {
				yield	analyHtml(html, In, midunPicked)
				midunPicked.delete(url)
			}
		} catch (err) {
			console.log(err.message)
		}
	}
	// 结束
	return	
}

//核心函数
// 获得页面html
function getUrl(url, encode = 'utf-8') {
	return new Promise((resolve, reject) => {
		let key = false
			, get = false
		setTimeout(() => {
			if (!key) {
				get = true
				console.log('请求超时...')
				resolve('timeout')
			}
		},20000)
		console.log(`正在爬取${ url }...`)
		request.get(url)
				.charset(encode)
				.end((err, res) => {
					if (get)
						return
					if (err)
						reject(err)
					key = true
					console.log('爬取成功,正在分析...')
					resolve(res.text)
				}).on('error', (err) => {
					reject(err)
				})
	})
}
// 获得入口url
function enter(html) {
	const $ = cheerio.load(html)

	return $('#container .mainnav .main.b-detail .detail .b-info .b-oper > a:first-child').attr('href')
}
// 获取第一章url
function getFirst(html) {
	const $ = cheerio.load(html)

	return $('.chapterSo .chapterNum > ul .dirconone').find('li:first-child > a').attr('href')
}
// 拼接完整url
function plusUrl(url) {
	return baseUrl + url
}
function splitUrl(html, InHtml) {
	return InHtml + '/' + html
}
// 添加新书到数据库
function addBook(html) {
	return new Promise((resolve, reject) => {
		const $ = cheerio.load(html)

		book.title =	$('#container .mainnav .main.b-detail').find('.detail .b-info > h1').text()
		book.authors = $('.author .bookDetail .bookso').find('dd a').text()
		book.cover = $('#container .mainnav .main.b-detail').find('.l.mr11 > img').attr('src')
		book.summary = $('#container .mainnav .main.b-detail').find('.detail .b-info #waa').text()
		book.arcs =[]

		book = new Movie(book)

		book.save((err) => {
			if (err)
				reject(err)

			resolve()
		})
	})
}
// 下部
function addNextBook(name) {
	return new Promise((resolve, reject) => {
		Movie.find({ name: name })
			.exec((err, oldBook) => {
			if (err)
				reject(err)

			oldBook = oldBook[0]
			book.name =	oldBook.name
			book.autor = oldBook.autor
			book.avaiter = oldBook.avaiter
			book.intrudoce = oldBook.intrudoce
			book.arcs = []

			book = new Movie(book)

			book.save((err) => {
				if (err)
					reject(err)

				resolve()
			})
		})
			
	})

}
// 分析每章内容存至数据库
function analyHtml(html, In, unPicked) {
	return new Promise((resolve, reject) => {
		const $ = cheerio.load(html)
		let arcticle = {}
			, nextUrl = ''

		nextUrl = $('.backs').find('.next').attr('href')
		arcticle.title = $('.main.b-detail .bookInfo > h1:first-child').find('.l.jieqi_title').text()
		arcticle.content = $('.main.b-detail .bookInfo').find('#content').text()

		if (nextUrl !== 'index.html')
			unPicked.add(splitUrl(nextUrl, In))
		else
			console.log('done!')

		book.arcs.push(arcticle)

		book.save((err) => {
			if (err)
				reject(err)	
			
			resolve()
		})
		// console.log(book.arcs.length)
	})
}

// 导出流程
module.exports = gener